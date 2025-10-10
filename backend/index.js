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
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
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

// In-memory storage for documents and their embeddings
let documents = new Map();

// Helper function to split text into chunks
function splitTextIntoChunks(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push({
      text: chunk,
      start,
      end,
    });
    start = end - overlap;
  }
  
  return chunks;
}

// Simple text-based search (no embeddings needed for demo)
function searchChunks(chunks, query) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  return chunks.map((chunk, index) => {
    const chunkLower = chunk.text.toLowerCase();
    let score = 0;
    
    // Score based on keyword matches
    queryWords.forEach(word => {
      const count = (chunkLower.match(new RegExp(word, 'g')) || []).length;
      score += count;
    });
    
    return { ...chunk, score, index };
  })
  .filter(chunk => chunk.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 5); // Top 5 relevant chunks
}

// Helper function to create embeddings using Gemini (only when needed)
async function createEmbedding(text) {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error creating embedding:', error);
    // Fallback: create a simple hash-based embedding for demo purposes
    return createSimpleEmbedding(text);
  }
}

// Simple fallback embedding function (for demo when API fails)
function createSimpleEmbedding(text) {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0); // Standard embedding size
  
  words.forEach((word, index) => {
    const hash = word.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    embedding[Math.abs(hash) % 384] += 1;
  });
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
}

// Helper function to calculate cosine similarity
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Routes

// Upload document
app.post('/api/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    
    console.log('File uploaded:', req.file.originalname);
    
    // Parse PDF
    console.log('Parsing PDF...');
    const pdfData = await pdfParse(fileBuffer);
    const text = pdfData.text;
    console.log(`PDF parsed. Text length: ${text.length} characters`);
    
    // Split text into chunks (no embeddings during upload - saves memory!)
    const chunks = splitTextIntoChunks(text);
    console.log(`Split into ${chunks.length} chunks`);
    
    // Store document data
    const documentId = uuidv4();
    documents.set(documentId, {
      id: documentId,
      filename: req.file.originalname,
      filePath: req.file.filename,
      text,
      chunks: chunks, // Store chunks without embeddings
      uploadedAt: new Date().toISOString(),
    });
    
    console.log(`Document stored with ID: ${documentId}`);
    
    res.json({
      success: true,
      documentId,
      filename: req.file.originalname,
      message: 'Document uploaded and processed successfully',
    });
    
  } catch (error) {
    console.error('Upload error:', error);
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
    filePath: document.filePath,
    text: document.text,
  });
});

// Ask question about document
app.post('/api/ask', async (req, res) => {
  try {
    const { question, documentId } = req.body;
    
    console.log(`Question received: "${question}" for document: ${documentId}`);
    
    if (!question || !documentId) {
      return res.status(400).json({ error: 'Question and document ID are required' });
    }
    
    const document = documents.get(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Use simple text-based search (no embeddings needed!)
    const relevantChunks = searchChunks(document.chunks, question);
    
    console.log(`Found ${relevantChunks.length} relevant chunks`);
    
    if (relevantChunks.length === 0) {
      return res.json({
        success: true,
        answer: "I couldn't find relevant information in the document to answer your question.",
        relevantChunks: [],
      });
    }
    
    // Create context from relevant chunks
    const context = relevantChunks.map(chunk => chunk.text).join('\n\n');
    
    // Generate answer using Gemini
    const prompt = `Based on the following document content, answer the question. Be concise and informative. If the exact answer isn't in the content, provide the most relevant information available.

Document content:
${context}

Question: ${question}

Answer:`;

    console.log('Sending to Gemini API...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();
    
    console.log('Answer generated successfully');
    
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
    console.error('Ask error:', error);
    res.status(500).json({ error: 'Failed to process question: ' + error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  res.status(500).json({ error: error.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Make sure to set your GEMINI_API_KEY in the .env file');
  console.log('Get your free API key from: https://aistudio.google.com/');
});