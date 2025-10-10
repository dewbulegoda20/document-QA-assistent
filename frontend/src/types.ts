export interface Document {
  id: string;
  filename: string;
  uploadedAt: string;
  metadata?: {
    chunkCount?: number;
    vectorCount?: number;
    wordCount?: number;
    pageCount?: number;
  };
}

export interface RelevantChunk {
  text: string;
  start: number;
  end: number;
  similarity?: number;
  score?: number;
  metadata?: {
    filename?: string;
    chunkIndex?: number;
    type?: string;
  };
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  relevantChunks?: RelevantChunk[];
  searchMetadata?: {
    totalChunks?: number;
    searchedChunks?: number;
    maxSimilarity?: number;
  };
}

export interface ChatInterfaceProps {
  documentId: string;
  onHighlightChunks: (chunks: RelevantChunk[]) => void;
}

export interface FileUploadProps {
  onDocumentSelect: (document: Document) => void;
}

export interface DocumentViewerProps {
  documentId: string;
  highlightedChunks: RelevantChunk[];
}