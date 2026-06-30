/**
 * Migration Script: Re-ingest Documents with OpenAI Embeddings
 *
 * This script migrates from the old hash-based embedding system to real OpenAI embeddings.
 * It processes all existing documents and generates proper semantic embeddings.
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { EmbeddingService } from '../src/services/EmbeddingService';
import { ChunkingService } from '../src/services/ChunkingService';
import { VectorStoreService } from '../src/services/VectorStoreService';

// Load environment variables
dotenv.config();

interface Document {
    id: string;
    project_id: string;
    document_group_id: string;
    original_filename: string;
    storage_path: string;
    version: number;
}

interface DocumentContent {
    id: string;
    content?: string;
}

class EmbeddingMigration {
    private supabase;
    private embeddingService: EmbeddingService;
    private chunkingService: ChunkingService;
    private vectorStoreService: VectorStoreService;

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.embeddingService = new EmbeddingService();
        this.chunkingService = new ChunkingService();
        this.vectorStoreService = new VectorStoreService();
    }

    async run() {
        console.log('🚀 Starting embedding migration to OpenAI...');

        try {
            // Test OpenAI connection first
            const connectionTest = await this.embeddingService.testConnection();
            if (!connectionTest) {
                throw new Error('Failed to connect to OpenAI API. Check your OPENAI_API_KEY.');
            }

            // Get all documents that need re-processing
            const documents = await this.getDocumentsToProcess();
            console.log(`📄 Found ${documents.length} documents to process`);

            if (documents.length === 0) {
                console.log('✅ No documents to process. Migration complete.');
                return;
            }

            // Process each document
            let processed = 0;
            let failed = 0;

            for (const doc of documents) {
                try {
                    console.log(`\n📖 Processing: ${doc.original_filename} (${doc.id})`);
                    await this.processDocument(doc);
                    processed++;
                    console.log(`✅ Completed: ${doc.original_filename}`);

                    // Add delay between documents to respect API rate limits
                    await this.delay(1000);

                } catch (error) {
                    failed++;
                    console.error(`❌ Failed to process ${doc.original_filename}:`, error);
                }
            }

            console.log(`\n📊 Migration Summary:`);
            console.log(`   - Documents processed: ${processed}`);
            console.log(`   - Documents failed: ${failed}`);
            console.log(`   - Success rate: ${Math.round((processed / documents.length) * 100)}%`);

            if (processed > 0) {
                console.log(`\n🎉 Migration completed! ${processed} documents now have semantic embeddings.`);
            }

        } catch (error) {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        }
    }

    /**
     * Get all documents that need embedding processing
     */
    private async getDocumentsToProcess(): Promise<Document[]> {
        const { data, error } = await this.supabase
            .from('documents')
            .select('id, project_id, document_group_id, original_filename, storage_path, version')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch documents: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Process a single document: extract content, chunk, embed, and store
     */
    private async processDocument(doc: Document): Promise<void> {
        // Get document content from the content column (extracted by Tika)
        const content = await this.getDocumentContent(doc.id);

        if (!content || content.trim().length === 0) {
            console.warn(`   ⚠️ No content found for ${doc.original_filename}, skipping`);
            return;
        }

        console.log(`   📝 Content length: ${content.length} characters`);

        // Chunk the content
        const chunks = this.chunkingService.chunkText(content);
        console.log(`   ✂️ Created ${chunks.length} chunks`);

        if (chunks.length === 0) {
            console.warn(`   ⚠️ No chunks created for ${doc.original_filename}, skipping`);
            return;
        }

        // Generate embeddings
        console.log(`   🧠 Generating embeddings...`);
        const embeddings = await this.embeddingService.generateEmbeddings(chunks);

        if (embeddings.length !== chunks.length) {
            throw new Error(`Mismatch: ${chunks.length} chunks but ${embeddings.length} embeddings`);
        }

        // Store in vector database
        console.log(`   💾 Storing vectors...`);
        await this.vectorStoreService.storeVectors(
            doc.project_id,
            doc.document_group_id,
            doc.version,
            chunks,
            embeddings,
            { source_type: 'DOCUMENT' }
        );

        console.log(`   ✨ Stored ${embeddings.length} vectors for ${doc.original_filename}`);
    }

    /**
     * Get document content from the database
     * The content is stored in the documents table as extracted text
     */
    private async getDocumentContent(documentId: string): Promise<string | null> {
        // Try to get content from the content column if it exists
        const { data, error } = await this.supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (error) {
            console.warn(`Failed to get content for document ${documentId}: ${error.message}`);
            return null;
        }

        // Check if content column exists and has data
        if (data && 'content' in data && data.content) {
            return data.content;
        }

        // If no content column or no content, return a placeholder
        console.warn(`No content found for document ${documentId}`);
        return null;
    }

    /**
     * Utility: Add delay between operations
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the migration if this file is executed directly
if (require.main === module) {
    const migration = new EmbeddingMigration();
    migration.run().catch(error => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
}