import { useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import type { FileUploadProps } from '../types';

const UploadPage: React.FC<FileUploadProps> = ({ onDocumentSelect }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onDocumentSelect({
          id: result.documentId,
          filename: result.filename,
          uploadedAt: new Date().toISOString(),
        });
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: '#fafbfc',
      marginTop: '-20px'
    }}>
      <div style={{
        maxWidth: '640px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Main Heading */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '12px'
        }}>
          Upload Your Documents
        </h1>
        
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '40px'
        }}>
          Supported file types: PDF, DOCX, TXT. Max 10MB
        </p>

        {/* Upload Box */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '60px 40px',
            border: dragOver ? '2px solid #2563eb' : '2px dashed #d1d5db',
            transition: 'all 0.3s ease',
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.6 : 1
          }}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            if (!uploading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div className="loading" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
              <p style={{ color: '#6b7280', fontSize: '15px', fontWeight: '500' }}>Processing document...</p>
            </div>
          ) : (
            <>
              {/* Upload Icon */}
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                background: '#f3f4f6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Upload size={40} color="#9ca3af" />
              </div>

              {/* Text */}
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '12px'
              }}>
                Drag & drop files here
              </h3>
              
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '24px'
              }}>
                or
              </p>

              {/* Browse Button */}
              <label style={{ cursor: 'pointer' }}>
                <span
                  className="btn"
                  style={{
                    padding: '12px 32px',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'inline-block',
                    cursor: 'pointer'
                  }}
                >
                  Browse Files
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
              </label>
            </>
          )}
        </div>

        {/* Terms Text */}
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          marginTop: '24px'
        }}>
          By uploading, you agree to our{' '}
          <a href="#" style={{ color: '#2563eb', textDecoration: 'none' }}>
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="#" style={{ color: '#2563eb', textDecoration: 'none' }}>
            Privacy Policy
          </a>
        </p>

        {/* Error Message */}
        {error && (
          <div style={{
            marginTop: '20px',
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '14px' }}>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
