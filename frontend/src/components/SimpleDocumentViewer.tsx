import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface SimpleDocumentViewerProps {
  documentId: string;
  documentName: string;
  highlightedText?: string;
}

const SimpleDocumentViewer: React.FC<SimpleDocumentViewerProps> = ({ 
  documentId, 
  documentName,
  highlightedText 
}) => {
  const [documentContent, setDocumentContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocumentContent();
  }, [documentId]);

  const fetchDocumentContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching document:', documentId);
      
      const response = await fetch(`/api/documents/${documentId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Document data received:', data);
      
      if (data && data.text) {
        setDocumentContent(data.text);
      } else {
        setDocumentContent('Document content is not available');
      }
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document content');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!documentContent || documentContent === 'Document content is not available') {
      return (
        <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>
          {documentContent || 'No content available'}
        </div>
      );
    }

    // If there's highlighted text, highlight it in the document
    if (highlightedText && highlightedText.trim()) {
      try {
        const escapedText = highlightedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = documentContent.split(new RegExp(`(${escapedText})`, 'gi'));
        
        return (
          <div>
            {parts.map((part, index) => {
              if (part.toLowerCase() === highlightedText.toLowerCase()) {
                return (
                  <mark
                    key={index}
                    style={{
                      backgroundColor: 'rgba(254, 240, 138, 0.5)',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      fontWeight: '500'
                    }}
                  >
                    {part}
                  </mark>
                );
              }
              return <span key={index}>{part}</span>;
            })}
          </div>
        );
      } catch (err) {
        console.error('Error highlighting text:', err);
        return documentContent;
      }
    }

    return documentContent;
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#fafbfc'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 30px',
        borderBottom: '1px solid #e5e7eb',
        background: 'white'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '8px'
        }}>
          Document Viewer
        </h2>
        <p style={{
          fontSize: '13px',
          color: '#6b7280'
        }}>
          Uploaded Document: <span style={{ fontWeight: '500', color: '#374151' }}>{documentName}</span>
        </p>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '30px',
        background: '#f9fafb'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '16px'
          }}>
            <div className="loading" style={{ width: '32px', height: '32px', borderWidth: '3px' }}></div>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading document...</p>
          </div>
        ) : error ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '12px',
            color: '#dc2626'
          }}>
            <AlertCircle size={48} />
            <p style={{ fontSize: '14px' }}>{error}</p>
            <button 
              onClick={fetchDocumentContent}
              className="btn"
              style={{ marginTop: '12px', fontSize: '13px', padding: '8px 16px' }}
            >
              Retry
            </button>
          </div>
        ) : (
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '14px',
            lineHeight: '1.8',
            color: '#374151',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            minHeight: '200px'
          }}>
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleDocumentViewer;
