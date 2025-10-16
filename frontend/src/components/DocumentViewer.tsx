import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { AlertCircle } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { DocumentViewerProps } from '../types';

// Set up PDF.js worker - try local first, fallback to CDN
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentId, highlightedChunks = [] }) => {
  const [documentData, setDocumentData] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Ensure highlightedChunks is always a valid array
  const safeHighlightedChunks = Array.isArray(highlightedChunks) ? highlightedChunks : [];
  
  // Navigate to page when highlighted chunks change and have page numbers
  useEffect(() => {
    if (safeHighlightedChunks.length > 0 && safeHighlightedChunks[0].page) {
      const targetPage = safeHighlightedChunks[0].page;
      console.log(`🎯 Target page: ${targetPage}, Current page: ${pageNumber}, Total pages: ${numPages}`);
      
      if (targetPage >= 1 && targetPage <= numPages) {
        console.log(`📄 Navigating to page ${targetPage}`);
        setPageNumber(targetPage);
      } else {
        console.warn(`⚠️ Invalid page number: ${targetPage}`);
      }
    }
  }, [safeHighlightedChunks, numPages]);
  
  // Apply highlighting to text layer after page renders
  useEffect(() => {
    if (safeHighlightedChunks.length > 0 && pageRef.current) {
      // Wait for text layer to be ready
      const timeoutId = setTimeout(() => {
        applyTextHighlights();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [pageNumber, safeHighlightedChunks, pdfFile]);

  const applyTextHighlights = () => {
    if (!pageRef.current) return;
    
    // Find all text layer spans
    const textLayer = pageRef.current.querySelector('.react-pdf__Page__textContent');
    if (!textLayer) {
      console.log('Text layer not found');
      return;
    }
    
    const textSpans = Array.from(textLayer.querySelectorAll('span')) as HTMLElement[];
    
    // Remove existing highlights
    textSpans.forEach(span => {
      span.style.backgroundColor = '';
      span.style.boxShadow = '';
    });
    
    console.log('Highlighting chunks:', safeHighlightedChunks.length);
    
    // Build full text from all spans to enable better matching
    const fullPageText = textSpans.map(s => s.textContent || '').join(' ').toLowerCase();
    
    let firstHighlightedElement: HTMLElement | null = null;
    
    // Apply new highlights for each chunk
    safeHighlightedChunks.forEach(chunk => {
      if (!chunk || !chunk.text) return;
      
      const chunkText = chunk.text.trim();
      const chunkLower = chunkText.toLowerCase();
      
      // Try to find the chunk in the full text
      const chunkIndex = fullPageText.indexOf(chunkLower);
      
      if (chunkIndex === -1) {
        // If exact match not found, try matching by keywords
        const keywords = chunkText
          .split(/\s+/)
          .filter(word => word.length > 3)
          .map(w => w.toLowerCase());
        
        textSpans.forEach(span => {
          const spanText = (span.textContent || '').toLowerCase();
          
          // Highlight if span contains significant keywords
          const matchCount = keywords.filter(kw => spanText.includes(kw)).length;
          
          if (matchCount >= 2 || (matchCount >= 1 && keywords.length <= 2)) {
            span.style.backgroundColor = 'rgba(255, 255, 0, 0.35)';
            span.style.boxShadow = '0 0 0 1px rgba(255, 255, 0, 0.5)';
            if (!firstHighlightedElement) firstHighlightedElement = span;
          }
        });
      } else {
        // Exact match found - highlight sequentially
        let currentPos = 0;
        let targetStart = chunkIndex;
        let targetEnd = chunkIndex + chunkLower.length;
        
        for (const span of textSpans) {
          const spanText = span.textContent || '';
          const spanStart = currentPos;
          const spanEnd = currentPos + spanText.length + 1; // +1 for space
          
          // Check if this span is within the target range
          if (spanStart < targetEnd && spanEnd > targetStart) {
            span.style.backgroundColor = 'rgba(255, 255, 0, 0.35)';
            span.style.boxShadow = '0 0 0 1px rgba(255, 255, 0, 0.5)';
            if (!firstHighlightedElement) firstHighlightedElement = span;
          }
          
          currentPos = spanEnd;
        }
      }
    });
    
    // Auto-scroll to first highlighted element
    if (firstHighlightedElement) {
      setTimeout(() => {
        firstHighlightedElement?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }, 100);
    }
    
    console.log('Highlighting applied and scrolled to first match');
  };

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
      
      // Ensure data has the expected structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid document data received');
      }
      
      // Provide defaults for missing properties
      const safeData = {
        id: data.id || documentId,
        filename: data.filename || 'Unknown Document',
        uploadedAt: data.uploadedAt || new Date().toISOString(),
        text: data.text || '',
        metadata: data.metadata || {}
      };
      
      setDocumentData(safeData);
      
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
      <div className="document-header" style={{ 
        padding: '20px 30px',
        background: 'white',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#1f2937',
          marginBottom: '4px'
        }}>
          Document Viewer
        </h2>
        <p style={{ 
          fontSize: '12px', 
          color: '#9ca3af',
          margin: 0
        }}>
          {documentData.filename}
        </p>
        
        {/* REMOVED: Info banner section - no longer showing highlighted sections count */}
      </div>

      {/* PDF Viewer */}
      <div style={{ flex: 1, overflow: 'auto', background: 'linear-gradient(to bottom, #f3f4f6 0%, #e5e7eb 100%)', padding: '25px' }}>
        {pdfFile ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Navigation Controls */}
            <div className="pdf-controls">
              <button 
                onClick={goToPrevPage} 
                disabled={pageNumber <= 1}
                className="btn"
              >
                ← Previous
              </button>
              
              <span>
                Page {pageNumber} of {numPages}
              </span>
              
              <button 
                onClick={goToNextPage} 
                disabled={pageNumber >= numPages}
                className="btn"
              >
                Next →
              </button>
            </div>

            {/* PDF Document */}
            <div 
              ref={pageRef}
              style={{ 
                border: '2px solid #d1d5db', 
                borderRadius: '12px', 
                overflow: 'hidden', 
                backgroundColor: 'white',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s',
              }}
            >
              <Document
                file={pdfFile}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div style={{ padding: '60px', textAlign: 'center' }}>
                    <div className="loading" style={{ margin: '0 auto 20px', width: '40px', height: '40px' }}></div>
                    <p style={{ fontSize: '16px', color: '#6b7280' }}>Loading PDF...</p>
                  </div>
                }
                error={
                  <div style={{ padding: '60px', textAlign: 'center' }}>
                    <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#ef4444', fontSize: '16px' }}>Failed to load PDF</p>
                  </div>
                }
              >
                <Page 
                  pageNumber={pageNumber}
                  width={Math.min(window.innerWidth * 0.4, 700)}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  onLoadSuccess={applyTextHighlights}
                />
              </Document>
            </div>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '30px', 
            borderRadius: '12px',
            border: '2px solid #e5e7eb',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            whiteSpace: 'pre-wrap',
            fontSize: '15px',
            lineHeight: '1.8',
            fontFamily: 'Georgia, serif',
            maxWidth: '100%'
          }}>
            {/* Text content with enhanced highlights */}
            {safeHighlightedChunks && safeHighlightedChunks.length > 0 ? (
              <div>
                <div style={{ 
                  marginBottom: '25px', 
                  padding: '20px',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  borderRadius: '10px',
                  border: '2px solid #3b82f6'
                }}>
                  <h4 style={{ 
                    color: '#1e40af', 
                    marginBottom: '12px',
                    fontSize: '18px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🎯</span>
                    <span>Highlighted References</span>
                  </h4>
                  <p style={{ color: '#1e40af', fontSize: '14px', margin: 0 }}>
                    The following sections were identified as relevant to your question
                  </p>
                </div>

                {safeHighlightedChunks
                  .filter(chunk => chunk && typeof chunk === 'object' && chunk.text)
                  .map((chunk, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      marginBottom: '20px', 
                      padding: '20px',
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      border: '2px solid #f59e0b',
                      borderRadius: '10px',
                      borderLeft: '6px solid #f59e0b',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(5px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#92400e', 
                      marginBottom: '10px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span>📌 Reference {index + 1}</span>
                      {chunk.score && (
                        <span style={{
                          background: '#fff7ed',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          border: '1px solid #fb923c'
                        }}>
                          Relevance: {(chunk.score * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      color: '#78350f', 
                      fontSize: '15px',
                      lineHeight: '1.7',
                      fontFamily: 'Georgia, serif'
                    }}>
                      {chunk.text || 'No text available'}
                    </div>
                  </div>
                ))}
                
                <hr style={{ 
                  margin: '30px 0', 
                  border: 'none', 
                  borderTop: '2px solid #e5e7eb',
                  borderRadius: '2px'
                }} />
                
                <h4 style={{ 
                  color: '#374151', 
                  marginBottom: '20px',
                  fontSize: '18px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>📄</span>
                  <span>Full Document Content</span>
                </h4>
              </div>
            ) : null}
            
            {/* Render text with better highlights */}
            {(() => {
              if (!documentData || !documentData.text) {
                return (
                  <div className="empty-state">
                    <AlertCircle size={64} />
                    <h3>Document text unavailable</h3>
                    <p>The PDF file is available for viewing above</p>
                  </div>
                );
              }

              if (safeHighlightedChunks && safeHighlightedChunks.length > 0) {
                let highlightedText = documentData.text;
                
                const validChunks = safeHighlightedChunks.filter(chunk => 
                  chunk && 
                  typeof chunk === 'object' && 
                  chunk.text && 
                  typeof chunk.start === 'number' && 
                  typeof chunk.end === 'number'
                );
                
                const sortedChunks = [...validChunks].sort((a, b) => (b.start || 0) - (a.start || 0));
                
                sortedChunks.forEach((chunk, index) => {
                  if (chunk && chunk.text && chunk.text.trim()) {
                    const chunkText = chunk.text.trim();
                    const scoreDisplay = chunk.score ? ` ${(chunk.score * 100).toFixed(0)}% relevant` : '';
                    const highlightedChunk = `<mark class="highlight" title="Reference ${index + 1}${scoreDisplay}" style="background: linear-gradient(120deg, #fef3c7 0%, #fde68a 100%); padding: 4px 8px; border-radius: 6px; border-left: 4px solid #f59e0b; font-weight: 600; margin: 0 2px; display: inline-block; cursor: pointer;">${chunkText}</mark>`;
                    
                    const firstOccurrence = highlightedText.indexOf(chunkText);
                    if (firstOccurrence !== -1) {
                      highlightedText = highlightedText.substring(0, firstOccurrence) + 
                                      highlightedChunk + 
                                      highlightedText.substring(firstOccurrence + chunkText.length);
                    }
                  }
                });
                
                return (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: highlightedText.replace(/\n/g, '<br/>') 
                    }}
                    style={{ lineHeight: '1.8', color: '#374151' }}
                  />
                );
              } else {
                return (
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#374151' }}>
                    {documentData.text || 'Document content is not available.'}
                  </div>
                );
              }
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;