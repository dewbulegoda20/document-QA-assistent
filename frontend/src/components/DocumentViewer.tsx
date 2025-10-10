import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { DocumentViewerProps } from '../types';

// Set up PDF.js worker - try local first, fallback to CDN
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentId, highlightedChunks }) => {
  const [documentData, setDocumentData] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<string | null>(null);

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching document:', documentId);
      
      // Get document data
      const response = await fetch(`/api/documents/${documentId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Document data:', data);
      setDocumentData(data);
      
      // Get PDF file - use direct URL instead of blob
      console.log('Setting PDF URL...');
      const pdfUrl = `/api/documents/${documentId}/pdf`;
      console.log('PDF URL set:', pdfUrl);
      setPdfFile(pdfUrl);
      
    } catch (err) {
      console.error('Document fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully, pages:', numPages);
    setNumPages(numPages);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError(`Failed to load PDF: ${error.message}`);
  };

  const goToPrevPage = () => {
    setPageNumber(page => Math.max(1, page - 1));
  };

  const goToNextPage = () => {
    setPageNumber(page => Math.min(numPages, page + 1));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="loading" style={{ marginRight: '10px' }}></div>
        <span>Loading document...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#dc2626' }}>
        <p>{error}</p>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
        <p>No document selected</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Document Header */}
      <div style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '5px' }}>
          {documentData.filename}
        </h3>
        <p style={{ fontSize: '12px', color: '#6b7280' }}>
          Uploaded: {new Date(documentData.uploadedAt).toLocaleString()}
        </p>
        
        {highlightedChunks.length > 0 && (
          <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#fef3c7', borderRadius: '4px' }}>
            <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
              📍 {highlightedChunks.length} relevant section(s) found
            </p>
          </div>
        )}
      </div>

      {/* PDF Viewer */}
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f3f4f6', padding: '20px' }}>
        {pdfFile ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Navigation Controls */}
            <div style={{ 
              marginBottom: '15px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              backgroundColor: 'white',
              padding: '8px 15px',
              borderRadius: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <button 
                onClick={goToPrevPage} 
                disabled={pageNumber <= 1}
                className="btn"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                ← Prev
              </button>
              
              <span style={{ fontSize: '14px', color: '#374151' }}>
                Page {pageNumber} of {numPages}
              </span>
              
              <button 
                onClick={goToNextPage} 
                disabled={pageNumber >= numPages}
                className="btn"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                Next →
              </button>
            </div>

            {/* PDF Document */}
            <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'white' }}>
              <Document
                file={pdfFile}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div className="loading" style={{ margin: '0 auto 15px' }}></div>
                    <p>Loading PDF...</p>
                  </div>
                }
                error={
                  <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
                    <p>Failed to load PDF</p>
                  </div>
                }
              >
                <Page 
                  pageNumber={pageNumber}
                  width={Math.min(window.innerWidth * 0.4, 600)}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            </div>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            lineHeight: '1.6',
            fontFamily: 'system-ui, sans-serif'
          }}>
            {/* Text content with highlights */}
            {highlightedChunks.length > 0 ? (
              <div>
                <h4 style={{ color: '#374151', marginBottom: '15px' }}>Relevant Sections:</h4>
                {highlightedChunks.map((chunk, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      marginBottom: '15px', 
                      padding: '10px',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fde68a',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '5px' }}>
                      Section {index + 1} (Score: {chunk.score})
                    </div>
                    <div>{chunk.text}</div>
                  </div>
                ))}
                
                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
                <h4 style={{ color: '#374151', marginBottom: '15px' }}>Full Document:</h4>
              </div>
            ) : null}
            
            {documentData.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;