import { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import type { FileUploadProps } from '../types';
import { API_ENDPOINTS } from '../config/api';

const FileUpload: React.FC<FileUploadProps> = ({ onDocumentSelect }) => {
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
      const response = await fetch(API_ENDPOINTS.UPLOAD, {
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
    <div style={{ width: '100%', maxWidth: '400px' }}>
      <div
        className={`upload-area ${dragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        style={{ opacity: uploading ? 0.5 : 1, pointerEvents: uploading ? 'none' : 'auto' }}
      >
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="loading" style={{ marginBottom: '16px' }}></div>
            <p style={{ color: '#6b7280' }}>Processing document...</p>
          </div>
        ) : (
          <>
            <Upload size={48} style={{ color: '#9ca3af', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Upload PDF Document</h3>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              Drag and drop your PDF file here, or click to browse
            </p>
            <label className="btn" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              <FileText size={16} style={{ marginRight: '8px' }} />
              Choose File
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

      {error && (
        <div className="error" style={{ marginTop: '16px', display: 'flex', alignItems: 'center' }}>
          <AlertCircle size={20} style={{ marginRight: '8px' }} />
          <p>{error}</p>
        </div>
      )}

      <div style={{ marginTop: '24px', fontSize: '14px', color: '#6b7280' }}>
        <p style={{ fontWeight: '600', marginBottom: '8px' }}>Supported format:</p>
        <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
          <li>PDF files up to 10MB</li>
          <li>Text-based PDFs (not scanned images)</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;