import { pdfjs } from 'react-pdf';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  // Try local worker first
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  
  // Fallback to CDN with different approach
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
  }
}

export { pdfjs };