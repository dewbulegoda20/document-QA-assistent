import { useState } from 'react';
import UploadPage from './components/UploadPage';
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
    const safeChunks = Array.isArray(chunks) ? chunks : [];
    console.log('🎨 App: handleHighlightChunks called with', safeChunks.length, 'chunks');
    if (safeChunks.length > 0) {
      console.log('📄 First chunk page:', safeChunks[0].page);
    }
    setHighlightedChunks(safeChunks);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Professional Navigation Bar */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 20px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: 'white',
            fontSize: '18px'
          }}>
            D
          </div>
          <span style={{ 
            fontSize: '20px', 
            fontWeight: '700',
            color: '#1f2937'
          }}>
            DocuAssist
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="#" style={{ 
            textDecoration: 'none', 
            color: '#4b5563',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'color 0.2s'
          }} onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
             onMouseLeave={(e) => e.currentTarget.style.color = '#4b5563'}>
            Home
          </a>
          <a href="#" style={{ 
            textDecoration: 'none', 
            color: '#4b5563',
            fontSize: '14px',
            fontWeight: '500'
          }} onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
             onMouseLeave={(e) => e.currentTarget.style.color = '#4b5563'}>
            Documents
          </a>
          <a href="#" style={{ 
            textDecoration: 'none', 
            color: '#4b5563',
            fontSize: '14px',
            fontWeight: '500'
          }} onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
             onMouseLeave={(e) => e.currentTarget.style.color = '#4b5563'}>
            Settings
          </a>
          
          {/* Change Document Button - Show when document is loaded */}
          {selectedDocument ? (
            <button
              onClick={() => setSelectedDocument(null)}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Change Document
            </button>
          ) : (
            <button className="btn" style={{ 
              padding: '8px 16px',
              fontSize: '13px'
            }}>
              Get Started
            </button>
          )}
        </div>
      </nav>

      <div className="container">
        {/* Show upload page or main interface */}
        {!selectedDocument ? (
          <>
            {/* Upload Page - No header needed, component has its own */}
            <UploadPage onDocumentSelect={handleDocumentSelect} />
          </>
        ) : (
          <>
            {/* Main Content - No header, direct to panels */}
            <div className="grid" style={{ marginTop: '10px' }}>
              {/* Left Panel - Chat Interface (styled as simple question panel) */}
              <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px 30px', borderBottom: '1px solid #e5e7eb' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    Ask a Question
                  </h2>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <ChatInterface
                    documentId={selectedDocument.id}
                    onHighlightChunks={handleHighlightChunks}
                  />
                </div>
              </div>

              {/* Right Panel - Document Viewer (original working component) */}
              <div className="panel">
                <DocumentViewer
                  documentId={selectedDocument.id}
                  highlightedChunks={highlightedChunks || []}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
