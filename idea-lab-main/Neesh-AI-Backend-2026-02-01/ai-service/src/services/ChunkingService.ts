import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

/**
 * ChunkingService
 *
 * Splits document text into overlapping chunks for embedding and retrieval.
 *
 * Configuration via environment variables (allows A/B testing without code changes):
 *   CHUNK_SIZE    — characters per chunk  (default: 500)
 *   CHUNK_OVERLAP — overlap between chunks (default: 50)
 *
 * Preset recommendations:
 *   Small  (200 / 30)  — dense factual documents, Q&A pairs
 *   Medium (500 / 50)  — general purpose (default)
 *   Large  (800 / 100) — long-form narrative or legal documents
 */
export class ChunkingService {
    private splitter: RecursiveCharacterTextSplitter;
    private chunkSize: number;
    private chunkOverlap: number;

    constructor() {
        this.chunkSize   = parseInt(process.env.CHUNK_SIZE   || '500', 10);
        this.chunkOverlap = parseInt(process.env.CHUNK_OVERLAP || '50',  10);

        // Guard against invalid env values
        if (isNaN(this.chunkSize)   || this.chunkSize < 50)   this.chunkSize = 500;
        if (isNaN(this.chunkOverlap) || this.chunkOverlap < 0) this.chunkOverlap = 50;
        if (this.chunkOverlap >= this.chunkSize) this.chunkOverlap = Math.floor(this.chunkSize * 0.1);

        this.splitter = new RecursiveCharacterTextSplitter({
            chunkSize:    this.chunkSize,
            chunkOverlap: this.chunkOverlap,
            separators:   ['\n\n', '\n', ' ', ''],
            keepSeparator: false,
        });

        console.log(
            `[ChunkingService] Initialized — chunkSize: ${this.chunkSize}, ` +
            `chunkOverlap: ${this.chunkOverlap}`
        );
    }

    async chunkText(text: string): Promise<string[]> {
        if (!text) return [];

        const normalizedText = text.replace(/\r\n/g, '\n');
        const docs = await this.splitter.createDocuments([normalizedText]);

        return docs
            .map(doc => doc.pageContent)
            .filter(content => content.trim().length > 0);
    }

    /**
     * Chunk with an explicitly specified size — useful for per-project overrides.
     */
    async chunkTextWithSize(text: string, chunkSize: number, chunkOverlap: number): Promise<string[]> {
        if (!text) return [];

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize,
            chunkOverlap,
            separators:   ['\n\n', '\n', ' ', ''],
            keepSeparator: false,
        });

        const docs = await splitter.createDocuments([text.replace(/\r\n/g, '\n')]);
        return docs
            .map(doc => doc.pageContent)
            .filter(content => content.trim().length > 0);
    }

    getConfig(): { chunkSize: number; chunkOverlap: number } {
        return { chunkSize: this.chunkSize, chunkOverlap: this.chunkOverlap };
    }
}
