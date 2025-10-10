const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// In-memory storage
const documents = new Map();

// Initialize Gemini AI with better error handling
let model = null;
let embeddingModel = null;

async function initializeGemini() {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
    console.log('✅ Gemini AI initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Gemini AI initialization failed:', error.message);
    console.log('⚠️  Running without AI features');
    return false;
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file upload
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
    port: PORT,
    geminiAI: !!model,
    embeddings: !!embeddingModel
  });
});

// Simple upload endpoint
app.post('/api/upload', upload.single('document'), async (req, res) => {
  console.log('📤 Upload request received');
  
  try {
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`📄 Processing: ${req.file.originalname}`);
    
    // Read and parse PDF with better error handling
    const fileBuffer = fs.readFileSync(req.file.path);
    let pdfData, text;
    
    try {
      pdfData = await pdfParse(fileBuffer);
      text = pdfData.text;
    } catch (pdfError) {
      console.log('⚠️  PDF parsing failed, using basic text extraction:', pdfError.message);
      // Fallback: just store the file without parsing
      text = "PDF content could not be extracted, but file is stored for viewing.";
      pdfData = { numpages: 1 };
    }
    
    console.log(`✅ PDF parsed: ${text.length} characters`);
    
    // Store document
    const documentId = uuidv4();
    
    documents.set(documentId, {
      id: documentId,
      filename: req.file.originalname,
      filePath: req.file.path,
      text,
      uploadedAt: new Date().toISOString(),
      metadata: {
        pageCount: pdfData.numpages || 1,
        wordCount: text.split(/\\s+/).length
      }
    });
    
    console.log(`✅ Document stored: ${documentId}`);
    
    res.json({
      success: true,
      documentId,
      filename: req.file.originalname,
      message: 'Document uploaded successfully',
      metadata: {
        wordCount: text.split(/\\s+/).length,
        pageCount: pdfData.numpages || 1
      }
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: 'Failed to process document: ' + error.message });
  }
});

// Get documents list
app.get('/api/documents', (req, res) => {
  const documentsList = Array.from(documents.values()).map(doc => ({
    id: doc.id,
    filename: doc.filename,
    uploadedAt: doc.uploadedAt,
    metadata: doc.metadata
  }));
  
  res.json(documentsList);
});

// Get document by ID
app.get('/api/documents/:id', (req, res) => {
  const document = documents.get(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  res.json({
    id: document.id,
    filename: document.filename,
    uploadedAt: document.uploadedAt,
    metadata: document.metadata
  });
});

// Serve PDF file
app.get('/api/documents/:id/pdf', (req, res) => {
  const document = documents.get(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  if (!fs.existsSync(document.filePath)) {
    return res.status(404).json({ error: 'PDF file not found' });
  }
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${document.filename}"`);
  res.sendFile(path.resolve(document.filePath));
});

// Basic ask endpoint (without AI for now)
app.post('/api/ask', async (req, res) => {
  try {
    const { question, documentId } = req.body;
    
    if (!question || !documentId) {
      return res.status(400).json({ error: 'Question and document ID are required' });
    }
    
    const document = documents.get(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Simple response for now
    res.json({
      success: true,
      answer: "I can see your document but AI processing is currently disabled. Please check the backend logs.",
      relevantChunks: []
    });
    
  } catch (error) {
    console.error('❌ Ask error:', error);
    res.status(500).json({ error: 'Failed to process question: ' + error.message });
  }
});

// Start server
async function startServer() {
  await initializeGemini();
  
  app.listen(PORT, () => {
    console.log('🚀 Document Q&A Server Started');
    console.log(`📍 Server running on port ${PORT}`);
    console.log(`🌐 API available at: http://localhost:${PORT}`);
    console.log('📋 Endpoints:');
    console.log('   POST /api/upload - Upload PDF');
    console.log('   GET  /api/documents - List documents');
    console.log('   GET  /api/documents/:id/pdf - Serve PDF file');
    console.log('   POST /api/ask - Ask questions');
    console.log('   GET  /api/health - Health check');
    console.log('✅ Ready for document upload and processing!');
  });
}

startServer();