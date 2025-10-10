const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize Gemini AI with error handling
let model = null;
try {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  console.log('✅ Gemini AI initialized successfully');
} catch (error) {
  console.error('❌ Gemini AI initialization failed:', error.message);
  console.log('⚠️  API will work without AI features');
}

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// In-memory storage for documents
let documents = new Map();

// Simple text chunking function
function createSimpleChunks(text) {
  const chunkSize = 1000;
  const chunks = [];
  
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push({
      text: text.slice(i, i + chunkSize),
      start: i,
      end: Math.min(i + chunkSize, text.length)
    });
  }
  
  return chunks;
}

// Simple keyword search
function searchInText(text, query) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const chunks = createSimpleChunks(text);
  
  return chunks.map((chunk, index) => {
    const chunkLower = chunk.text.toLowerCase();
    let score = 0;
    
    queryWords.forEach(word => {
      const count = (chunkLower.match(new RegExp(word, 'g')) || []).length;
      score += count;
    });
    
    return { ...chunk, score, index };
  })
  .filter(chunk => chunk.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 3);
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Upload document - SIMPLIFIED AND FAST
app.post('/api/upload', upload.single('document'), async (req, res) => {
  console.log('📤 Upload request received');
  
  try {
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`📄 Processing: ${req.file.originalname}`);
    
    // Read and parse PDF
    const fileBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(fileBuffer);
    const text = pdfData.text;
    
    console.log(`✅ PDF parsed: ${text.length} characters`);
    
    // Create simple chunks (no AI processing during upload!)
    const chunks = createSimpleChunks(text);
    
    // Store document
    const documentId = uuidv4();
    documents.set(documentId, {
      id: documentId,
      filename: req.file.originalname,
      text,
      chunks,
      uploadedAt: new Date().toISOString(),
    });
    
    console.log(`✅ Document stored: ${documentId}`);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      documentId,
      filename: req.file.originalname,
      message: 'Document uploaded successfully',
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
  }));
  
  res.json(documentsList);
});

// Get document content
app.get('/api/documents/:id', (req, res) => {
  const document = documents.get(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  res.json({
    id: document.id,
    filename: document.filename,
    text: document.text,
    uploadedAt: document.uploadedAt,
  });
});

// Ask question - SIMPLIFIED AND FAST
app.post('/api/ask', async (req, res) => {
  console.log('❓ Question received');
  
  try {
    const { question, documentId } = req.body;
    
    if (!question || !documentId) {
      return res.status(400).json({ error: 'Question and document ID are required' });
    }
    
    const document = documents.get(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Simple keyword search
    const relevantChunks = searchInText(document.text, question);
    
    if (relevantChunks.length === 0) {
      return res.json({
        success: true,
        answer: "I couldn't find relevant information for your question in the document.",
        relevantChunks: [],
      });
    }
    
    // Create context
    const context = relevantChunks.map(chunk => chunk.text).join('\n\n');
    
    let answer = "Based on the document content, here's what I found:\n\n";
    
    // Try to use Gemini AI if available
    if (model && process.env.GEMINI_API_KEY) {
      try {
        console.log('🤖 Asking Gemini AI...');
        
        const prompt = `Answer this question based on the document content. Be concise and helpful.

Document content:
${context}

Question: ${question}

Answer:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        answer = response.text();
        
        console.log('✅ AI response generated');
        
      } catch (aiError) {
        console.error('⚠️  AI error, using fallback:', aiError.message);
        // Fallback to simple text matching
        answer += relevantChunks[0].text.substring(0, 300) + "...";
      }
    } else {
      // Fallback when no AI available
      console.log('📝 Using simple text extraction');
      answer += relevantChunks[0].text.substring(0, 300) + "...";
    }
    
    res.json({
      success: true,
      answer,
      relevantChunks: relevantChunks.map(chunk => ({
        text: chunk.text,
        start: chunk.start,
        end: chunk.end,
        score: chunk.score,
      })),
    });
    
  } catch (error) {
    console.error('❌ Ask error:', error);
    res.status(500).json({ error: 'Failed to process question: ' + error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 10MB)' });
    }
  }
  res.status(500).json({ error: error.message });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Document Q&A Server Started');
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌐 API available at: http://localhost:${PORT}`);
  console.log('📋 Endpoints:');
  console.log('   POST /api/upload - Upload PDF');
  console.log('   GET  /api/documents - List documents');
  console.log('   POST /api/ask - Ask questions');
  console.log('   GET  /api/health - Health check');
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️  GEMINI_API_KEY not set - AI features disabled');
    console.log('🔑 Get your free API key from: https://aistudio.google.com/');
  }
  
  console.log('✅ Ready to accept requests!');
});