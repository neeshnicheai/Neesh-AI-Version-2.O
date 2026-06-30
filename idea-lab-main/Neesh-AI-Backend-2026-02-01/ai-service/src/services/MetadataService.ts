export interface EnhancedMetadata {
    // Document metadata
    documentId: string;
    documentType: 'pdf' | 'doc' | 'txt' | 'md' | 'html' | 'other';
    fileSize: number;
    uploadDate: string;
    lastModified: string;

    // Content metadata
    language: string;
    wordCount: number;
    pageCount?: number;

    // Access control
    projectId: string;
    department?: string;
    accessLevel: 'public' | 'internal' | 'confidential' | 'restricted';
    tags: string[];

    // Quality metrics
    extractionQuality: 'high' | 'medium' | 'low';
    confidenceScore: number;

    // Chunk-specific metadata
    chunkIndex: number;
    chunkType: 'paragraph' | 'section' | 'table' | 'list' | 'header';
    sectionTitle?: string;

    // Semantic metadata
    topics: string[];
    entities: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
}

export interface FilterCriteria {
    projectIds?: string[];
    departments?: string[];
    accessLevels?: string[];
    tags?: string[];
    documentTypes?: string[];
    dateRange?: {
        start: string;
        end: string;
    };
    languages?: string[];
    minQualityScore?: number;
    topics?: string[];
}

export class MetadataService {
    private entityPatterns: Map<string, RegExp> = new Map();
    private topicKeywords: Map<string, string[]> = new Map();

    constructor() {
        this.initializeEntityPatterns();
        this.initializeTopicKeywords();
        console.log('[MetadataService] Initialized with enhanced metadata extraction');
    }

    /**
     * Extract comprehensive metadata from document content.
     */
    extractMetadata(
        content: string,
        documentInfo: {
            documentId: string;
            projectId: string;
            originalFilename: string;
            fileSize: number;
            uploadDate: string;
        },
        chunkIndex: number = 0
    ): EnhancedMetadata {
        console.log(`[MetadataService] Extracting metadata for document: ${documentInfo.originalFilename}`);

        try {
            // Basic document analysis
            const documentType = this.detectDocumentType(documentInfo.originalFilename);
            const language = this.detectLanguage(content);
            const wordCount = this.countWords(content);

            // Content analysis
            const chunkType = this.detectChunkType(content);
            const sectionTitle = this.extractSectionTitle(content);
            const topics = this.extractTopics(content);
            const entities = this.extractEntities(content);
            const sentiment = this.analyzeSentiment(content);

            // Quality assessment
            const extractionQuality = this.assessExtractionQuality(content);
            const confidenceScore = this.calculateConfidenceScore(content, extractionQuality);

            // Access level detection (based on content analysis)
            const accessLevel = this.determineAccessLevel(content);
            const tags = this.generateTags(content, topics, entities);

            const metadata: EnhancedMetadata = {
                documentId: documentInfo.documentId,
                documentType,
                fileSize: documentInfo.fileSize,
                uploadDate: documentInfo.uploadDate,
                lastModified: new Date().toISOString(),

                language,
                wordCount,

                projectId: documentInfo.projectId,
                accessLevel,
                tags,

                extractionQuality,
                confidenceScore,

                chunkIndex,
                chunkType,
                sectionTitle,

                topics,
                entities,
                sentiment
            };

            console.log(`[MetadataService] Extracted metadata - Topics: ${topics.length}, Entities: ${entities.length}`);
            return metadata;

        } catch (error: any) {
            console.warn(`[MetadataService] Metadata extraction failed: ${error.message}`);

            // Return minimal metadata on failure
            return {
                documentId: documentInfo.documentId,
                documentType: 'other',
                fileSize: documentInfo.fileSize,
                uploadDate: documentInfo.uploadDate,
                lastModified: new Date().toISOString(),
                language: 'en',
                wordCount: this.countWords(content),
                projectId: documentInfo.projectId,
                accessLevel: 'internal',
                tags: [],
                extractionQuality: 'low',
                confidenceScore: 0.3,
                chunkIndex: chunkIndex,
                chunkType: 'paragraph',
                topics: [],
                entities: [],
                sentiment: 'neutral'
            };
        }
    }

    /**
     * Generate advanced filter query based on metadata criteria.
     */
    buildMetadataFilter(criteria: FilterCriteria): string {
        const conditions: string[] = [];

        // Project filtering
        if (criteria.projectIds && criteria.projectIds.length > 0) {
            const projectList = criteria.projectIds.map(id => `'${id}'`).join(',');
            conditions.push(`project_id IN (${projectList})`);
        }

        // Department filtering
        if (criteria.departments && criteria.departments.length > 0) {
            const deptList = criteria.departments.map(d => `'${d}'`).join(',');
            conditions.push(`metadata->>'department' IN (${deptList})`);
        }

        // Access level filtering
        if (criteria.accessLevels && criteria.accessLevels.length > 0) {
            const accessList = criteria.accessLevels.map(a => `'${a}'`).join(',');
            conditions.push(`metadata->>'accessLevel' IN (${accessList})`);
        }

        // Tag filtering (contains any of the specified tags)
        if (criteria.tags && criteria.tags.length > 0) {
            const tagConditions = criteria.tags.map(tag =>
                `metadata->'tags' ? '${tag}'`
            ).join(' OR ');
            conditions.push(`(${tagConditions})`);
        }

        // Document type filtering
        if (criteria.documentTypes && criteria.documentTypes.length > 0) {
            const typeList = criteria.documentTypes.map(t => `'${t}'`).join(',');
            conditions.push(`metadata->>'documentType' IN (${typeList})`);
        }

        // Date range filtering
        if (criteria.dateRange) {
            conditions.push(`metadata->>'uploadDate' >= '${criteria.dateRange.start}'`);
            conditions.push(`metadata->>'uploadDate' <= '${criteria.dateRange.end}'`);
        }

        // Language filtering
        if (criteria.languages && criteria.languages.length > 0) {
            const langList = criteria.languages.map(l => `'${l}'`).join(',');
            conditions.push(`metadata->>'language' IN (${langList})`);
        }

        // Quality filtering
        if (criteria.minQualityScore) {
            conditions.push(`(metadata->>'confidenceScore')::float >= ${criteria.minQualityScore}`);
        }

        // Topic filtering
        if (criteria.topics && criteria.topics.length > 0) {
            const topicConditions = criteria.topics.map(topic =>
                `metadata->'topics' ? '${topic}'`
            ).join(' OR ');
            conditions.push(`(${topicConditions})`);
        }

        return conditions.length > 0 ? conditions.join(' AND ') : '';
    }

    /**
     * Detect document type from filename extension.
     */
    private detectDocumentType(filename: string): EnhancedMetadata['documentType'] {
        const ext = filename.split('.').pop()?.toLowerCase();

        switch (ext) {
            case 'pdf': return 'pdf';
            case 'doc':
            case 'docx': return 'doc';
            case 'txt': return 'txt';
            case 'md':
            case 'markdown': return 'md';
            case 'html':
            case 'htm': return 'html';
            default: return 'other';
        }
    }

    /**
     * Simple language detection based on character patterns.
     */
    private detectLanguage(content: string): string {
        // Very basic language detection
        const sample = content.substring(0, 1000).toLowerCase();

        // Check for common English patterns
        const englishWords = ['the', 'and', 'is', 'it', 'you', 'that', 'he', 'was', 'for', 'on'];
        const englishCount = englishWords.filter(word => sample.includes(` ${word} `)).length;

        if (englishCount >= 3) return 'en';

        // Could add more language detection logic here
        return 'en'; // Default to English
    }

    /**
     * Count words in content.
     */
    private countWords(content: string): number {
        return content.trim().split(/\s+/).length;
    }

    /**
     * Detect the type of chunk based on content patterns.
     */
    private detectChunkType(content: string): EnhancedMetadata['chunkType'] {
        const trimmed = content.trim();

        // Header detection (short text with title-like formatting)
        if (trimmed.length < 100 && /^[A-Z][^.!?]*$/.test(trimmed)) {
            return 'header';
        }

        // Table detection (contains multiple rows/columns patterns)
        if (/\|.*\|.*\|/.test(trimmed) || /\t.*\t/.test(trimmed)) {
            return 'table';
        }

        // List detection (starts with bullet points or numbers)
        if (/^[\s]*[-•*]\s/.test(trimmed) || /^[\s]*\d+[\.)]\s/.test(trimmed)) {
            return 'list';
        }

        // Section detection (contains section-like headers)
        if (/^(Chapter|Section|Part|Appendix)\s+\d+/i.test(trimmed)) {
            return 'section';
        }

        return 'paragraph'; // Default
    }

    /**
     * Extract section title from content.
     */
    private extractSectionTitle(content: string): string | undefined {
        const lines = content.split('\n');
        const firstLine = lines[0]?.trim();

        // If first line is short and looks like a title
        if (firstLine && firstLine.length < 100 && firstLine.length > 5) {
            // Check if it's title-case or all caps
            if (/^[A-Z][^.!?]*$/.test(firstLine) || firstLine === firstLine.toUpperCase()) {
                return firstLine;
            }
        }

        return undefined;
    }

    /**
     * Extract topics from content using keyword matching.
     */
    private extractTopics(content: string): string[] {
        const contentLower = content.toLowerCase();
        const foundTopics: Set<string> = new Set();

        for (const [topic, keywords] of this.topicKeywords) {
            const matches = keywords.filter(keyword => contentLower.includes(keyword)).length;
            if (matches >= 2) { // Require at least 2 keyword matches
                foundTopics.add(topic);
            }
        }

        return Array.from(foundTopics).slice(0, 5); // Limit to top 5 topics
    }

    /**
     * Extract entities (names, places, organizations) from content.
     */
    private extractEntities(content: string): string[] {
        const entities: Set<string> = new Set();

        for (const [entityType, pattern] of this.entityPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const cleaned = match.trim();
                    if (cleaned.length > 2 && cleaned.length < 50) {
                        entities.add(cleaned);
                    }
                });
            }
        }

        return Array.from(entities).slice(0, 10); // Limit to top 10 entities
    }

    /**
     * Simple sentiment analysis.
     */
    private analyzeSentiment(content: string): EnhancedMetadata['sentiment'] {
        const contentLower = content.toLowerCase();

        const positiveWords = ['good', 'great', 'excellent', 'success', 'achieve', 'improve', 'benefit'];
        const negativeWords = ['bad', 'error', 'problem', 'issue', 'fail', 'wrong', 'difficult'];

        const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length;
        const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length;

        if (positiveCount > negativeCount + 1) return 'positive';
        if (negativeCount > positiveCount + 1) return 'negative';
        return 'neutral';
    }

    /**
     * Assess quality of text extraction.
     */
    private assessExtractionQuality(content: string): EnhancedMetadata['extractionQuality'] {
        // Check for extraction artifacts and quality indicators
        const artifactCount = (content.match(/[^\w\s.,!?;:()\[\]{}'"%-]/g) || []).length;
        const artifactRatio = artifactCount / content.length;

        const wordCount = this.countWords(content);
        const avgWordLength = content.replace(/\s+/g, '').length / wordCount;

        // Quality scoring based on multiple factors
        if (artifactRatio < 0.01 && avgWordLength > 3 && wordCount > 10) {
            return 'high';
        } else if (artifactRatio < 0.05 && avgWordLength > 2) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Calculate overall confidence score.
     */
    private calculateConfidenceScore(content: string, quality: EnhancedMetadata['extractionQuality']): number {
        let score = 0.5; // Base score

        // Quality bonus
        switch (quality) {
            case 'high': score += 0.3; break;
            case 'medium': score += 0.1; break;
            case 'low': score -= 0.1; break;
        }

        // Content length bonus
        const wordCount = this.countWords(content);
        if (wordCount > 100) score += 0.1;
        if (wordCount > 500) score += 0.1;

        // Structure bonus (has punctuation and proper formatting)
        if (/[.!?]/.test(content)) score += 0.05;
        if (/[A-Z]/.test(content)) score += 0.05;

        return Math.max(0, Math.min(1, score));
    }

    /**
     * Determine access level based on content.
     */
    private determineAccessLevel(content: string): EnhancedMetadata['accessLevel'] {
        const contentLower = content.toLowerCase();

        const confidentialKeywords = ['confidential', 'secret', 'private', 'internal only', 'restricted'];
        const publicKeywords = ['public', 'open', 'general', 'everyone'];

        if (confidentialKeywords.some(word => contentLower.includes(word))) {
            return 'confidential';
        }

        if (publicKeywords.some(word => contentLower.includes(word))) {
            return 'public';
        }

        return 'internal'; // Default
    }

    /**
     * Generate relevant tags based on content analysis.
     */
    private generateTags(content: string, topics: string[], entities: string[]): string[] {
        const tags: Set<string> = new Set();

        // Add topics as tags
        topics.forEach(topic => tags.add(topic));

        // Add entity types as tags
        entities.slice(0, 3).forEach(entity => tags.add(entity.toLowerCase()));

        // Add content-based tags
        const contentLower = content.toLowerCase();
        if (contentLower.includes('tutorial')) tags.add('tutorial');
        if (contentLower.includes('guide')) tags.add('guide');
        if (contentLower.includes('documentation')) tags.add('documentation');
        if (contentLower.includes('api')) tags.add('api');
        if (contentLower.includes('specification')) tags.add('specification');

        return Array.from(tags).slice(0, 8); // Limit to 8 tags
    }

    /**
     * Initialize entity recognition patterns.
     */
    private initializeEntityPatterns(): void {
        this.entityPatterns.set('person', /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g);
        this.entityPatterns.set('organization', /\b[A-Z][a-zA-Z\s&.,]+(?:Inc|Corp|LLC|Ltd|Company|Organization)\b/g);
        this.entityPatterns.set('email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
        this.entityPatterns.set('url', /https?:\/\/[^\s]+/g);
        this.entityPatterns.set('date', /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g);

        console.log(`[MetadataService] Loaded ${this.entityPatterns.size} entity recognition patterns`);
    }

    /**
     * Initialize topic keyword mappings.
     */
    private initializeTopicKeywords(): void {
        this.topicKeywords.set('technology', ['software', 'system', 'application', 'technology', 'computer', 'digital']);
        this.topicKeywords.set('business', ['business', 'company', 'market', 'strategy', 'revenue', 'profit']);
        this.topicKeywords.set('project_management', ['project', 'timeline', 'deadline', 'milestone', 'task', 'schedule']);
        this.topicKeywords.set('documentation', ['document', 'guide', 'manual', 'instruction', 'specification']);
        this.topicKeywords.set('security', ['security', 'authentication', 'authorization', 'encryption', 'access']);
        this.topicKeywords.set('api', ['api', 'endpoint', 'interface', 'service', 'integration']);
        this.topicKeywords.set('database', ['database', 'data', 'query', 'table', 'storage']);
        this.topicKeywords.set('user_experience', ['user', 'interface', 'experience', 'usability', 'design']);

        console.log(`[MetadataService] Loaded ${this.topicKeywords.size} topic categories`);
    }
}