import { useState } from 'react';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import DocumentViewer from './components/DocumentViewer';
import type { Document, RelevantChunk } from './types';

function App() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [highlightedChunks, setHighlightedChunks] = useState<RelevantChunk[]>([]);

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    setHighlightedChunks([]);
  };

  const handleHighlightChunks = (chunks: RelevantChunk[]) => {
    setHighlightedChunks(chunks);
  };

  return (
    <div className="container">
      {/* Header */}
      <header style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>Document Q&A Assistant</h1>
        <p style={{ color: '#6b7280' }}>Upload a document and ask questions about its content</p>
      </header>

      {/* Main Content */}
      <div className="grid">
        {/* Left Panel - Upload and Chat */}
        <div className="panel">
          {!selectedDocument ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <FileUpload onDocumentSelect={handleDocumentSelect} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Document Info */}
              <div style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>{selectedDocument.filename}</h3>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>
                      Uploaded: {new Date(selectedDocument.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDocument(null)}
                    className="btn"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Change Document
                  </button>
                </div>
              </div>
              
              {/* Chat Interface */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ChatInterface
                  documentId={selectedDocument.id}
                  onHighlightChunks={handleHighlightChunks}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Document Viewer */}
        <div className="panel">
          {selectedDocument ? (
            <DocumentViewer
              documentId={selectedDocument.id}
              highlightedChunks={highlightedChunks}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '18px', marginBottom: '8px' }}>Upload a document to view it here</p>
                <p style={{ fontSize: '14px' }}>The document will appear with highlighted references when you ask questions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
