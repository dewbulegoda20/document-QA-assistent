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
let embeddingModel = null;

try {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
  console.log('✅ Gemini AI initialized successfully');
} catch (error) {
  console.error('❌ Gemini AI initialization failed:', error.message);
  console.log('⚠️  API will work with limited features');
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

// In-memory vector database and documents storage
let documents = new Map();
let vectorDatabase = new Map();

// AI Agent System Prompt
const SYSTEM_PROMPT = `You are a Professional Document Analysis AI Agent with the following characteristics:

ROLE: Expert Document Analyzer and Question-Answering Assistant

CORE PRINCIPLES:
1. ACCURACY FIRST: Only provide information that is explicitly stated in the provided document
2. FACT-BASED RESPONSES: Never hallucinate or add information not present in the source material
3. CITE SOURCES: Always reference specific sections, pages, or paragraphs when possible
4. TRANSPARENCY: If information is not available in the document, clearly state this limitation

RESPONSE GUIDELINES:
- Start responses with the confidence level (High/Medium/Low) based on document evidence
- Quote relevant excerpts from the document when applicable
- Use professional, clear, and concise language
- Structure answers logically with main points and supporting details
- When uncertain, acknowledge limitations rather than guessing

FORBIDDEN ACTIONS:
- Do not invent facts not present in the document
- Do not provide general knowledge outside the document scope
- Do not make assumptions beyond what is explicitly stated
- Do not provide advice unless specifically requested and supported by document content

RESPONSE FORMAT:
**Confidence Level: [High/Medium/Low]**

**Answer:**
[Your fact-based response here]

**Source Reference:**
[Specific section/page/paragraph from document]

**Additional Context:**
[Only if relevant and supported by document content]

Always remember: Your expertise comes from accurately interpreting and presenting the provided document content, not from external knowledge.`;

// Enhanced text chunking with overlap for better context
function createSmartChunks(text, filename) {
  const chunkSize = 800;
  const overlap = 150;
  const chunks = [];
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  let currentChunk = '';
  let currentStart = 0;
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        start: currentStart,
        end: currentStart + currentChunk.length,
        metadata: {
          filename,
          chunkIndex: chunks.length,
          type: 'paragraph_group'
        }
      });
      
      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + '\n\n' + paragraph;
      currentStart = currentStart + currentChunk.length - overlap;
    } else {
      if (currentChunk.length === 0) {
        currentStart = text.indexOf(paragraph);
      }
      currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph;
    }
  }
  
  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      start: currentStart,
      end: currentStart + currentChunk.length,
      metadata: {
        filename,
        chunkIndex: chunks.length,
        type: 'paragraph_group'
      }
    });
  }
  
  return chunks;
}

// Create embeddings using Gemini
async function createEmbedding(text) {
  if (!embeddingModel) {
    // Fallback to simple text-based similarity
    return createTextBasedEmbedding(text);
  }
  
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.warn('⚠️  Embedding failed, using text-based fallback:', error.message);
    return createTextBasedEmbedding(text);
  }
}

// Fallback text-based embedding
function createTextBasedEmbedding(text) {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0);
  
  words.forEach((word, index) => {
    if (word.length > 2) {
      const hash = word.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      embedding[Math.abs(hash) % 384] += 1;
    }
  });
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
}

// Cosine similarity calculation
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + (val * (b[i] || 0)), 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

// Enhanced semantic search with vector similarity
async function vectorSearch(query, documentId, topK = 5) {
  const document = documents.get(documentId);
  if (!document) return [];
  
  const docVectors = vectorDatabase.get(documentId);
  if (!docVectors) return [];
  
  // Create query embedding
  const queryEmbedding = await createEmbedding(query);
  
  // Calculate similarities
  const similarities = docVectors.map((chunkVector, index) => {
    const similarity = cosineSimilarity(queryEmbedding, chunkVector.embedding);
    return {
      ...document.chunks[index],
      similarity,
      index
    };
  });
  
  // Sort by similarity and return top results
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .filter(chunk => chunk.similarity > 0.1); // Minimum similarity threshold
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    features: {
      geminiAI: !!model,
      embeddings: !!embeddingModel,
      vectorDatabase: true
    }
  });
});

// Upload document with vector processing
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
    
    // Create smart chunks
    const chunks = createSmartChunks(text, req.file.originalname);
    console.log(`🧩 Created ${chunks.length} smart chunks`);
    
    // Create embeddings for vector database
    console.log('🔢 Creating embeddings...');
    const chunkVectors = [];
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await createEmbedding(chunks[i].text);
        chunkVectors.push({
          embedding,
          chunkIndex: i
        });
        
        if ((i + 1) % 5 === 0) {
          console.log(`   Processed ${i + 1}/${chunks.length} embeddings`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to create embedding for chunk ${i + 1}:`, error.message);
      }
    }
    
    // Store document and vectors
    const documentId = uuidv4();
    
    documents.set(documentId, {
      id: documentId,
      filename: req.file.originalname,
      filePath: req.file.path, // Keep original file for PDF viewing
      text,
      chunks,
      uploadedAt: new Date().toISOString(),
      metadata: {
        pageCount: pdfData.numpages || 1,
        wordCount: text.split(/\s+/).length,
        chunkCount: chunks.length
      }
    });
    
    vectorDatabase.set(documentId, chunkVectors);
    
    console.log(`✅ Document stored: ${documentId}`);
    console.log(`📊 Stats: ${chunks.length} chunks, ${chunkVectors.length} vectors`);
    
    res.json({
      success: true,
      documentId,
      filename: req.file.originalname,
      message: 'Document uploaded and vectorized successfully',
      metadata: {
        chunkCount: chunks.length,
        vectorCount: chunkVectors.length,
        wordCount: text.split(/\s+/).length
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
    metadata: document.metadata
  });
});

// Get PDF file for viewing
app.get('/api/documents/:id/pdf', (req, res) => {
  const document = documents.get(req.params.id);
  if (!document || !document.filePath) {
    return res.status(404).json({ error: 'PDF file not found' });
  }
  
  try {
    const filePath = document.filePath;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF file no longer exists' });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.filename}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('PDF serve error:', error);
    res.status(500).json({ error: 'Failed to serve PDF file' });
  }
});

// AI Agent Q&A with vector search
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
    
    console.log(`🔍 Searching for: "${question}"`);
    
    // Perform vector search
    const relevantChunks = await vectorSearch(question, documentId, 5);
    
    console.log(`📍 Found ${relevantChunks.length} relevant chunks`);
    
    if (relevantChunks.length === 0) {
      return res.json({
        success: true,
        answer: "**Confidence Level: Low**\n\n**Answer:**\nI couldn't find relevant information in the document to answer your question. The document may not contain the specific information you're looking for.\n\n**Source Reference:**\nNo relevant sections found in the document.\n\n**Suggestion:**\nTry rephrasing your question or asking about topics that are more clearly covered in the document.",
        relevantChunks: [],
      });
    }
    
    // Create context from relevant chunks
    const context = relevantChunks.map((chunk, index) => 
      `[Section ${index + 1}] ${chunk.text}\n`
    ).join('\n');
    
    let answer = "";
    
    // Use AI Agent if available
    if (model && process.env.GEMINI_API_KEY) {
      try {
        console.log('🤖 Consulting AI Agent...');
        
        const prompt = `${SYSTEM_PROMPT}

DOCUMENT CONTEXT:
${context}

USER QUESTION: ${question}

Please analyze the document content and provide a fact-based response following the specified format. Focus only on information explicitly stated in the provided context.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        answer = response.text();
        
        console.log('✅ AI Agent response generated');
        
      } catch (aiError) {
        console.error('⚠️  AI Agent error, using structured fallback:', aiError.message);
        
        // Structured fallback response
        answer = `**Confidence Level: Medium**

**Answer:**
Based on the document analysis, here are the relevant findings:

${relevantChunks.map((chunk, index) => 
  `${index + 1}. ${chunk.text.substring(0, 200)}...`
).join('\n\n')}

**Source Reference:**
Information extracted from ${relevantChunks.length} relevant section(s) of the document: "${document.filename}"

**Note:**
This response is based on keyword matching. For more accurate analysis, please ensure the AI service is properly configured.`;
      }
    } else {
      // Fallback structured response
      console.log('📝 Using structured text analysis');
      
      answer = `**Confidence Level: Medium**

**Answer:**
Based on the document content analysis, I found the following relevant information:

${relevantChunks.map((chunk, index) => 
  `**Section ${index + 1}:**\n${chunk.text.substring(0, 300)}...`
).join('\n\n')}

**Source Reference:**
Information extracted from ${relevantChunks.length} section(s) of "${document.filename}"

**Similarity Scores:**
${relevantChunks.map((chunk, index) => 
  `- Section ${index + 1}: ${(chunk.similarity * 100).toFixed(1)}% relevance`
).join('\n')}`;
    }
    
    res.json({
      success: true,
      answer,
      relevantChunks: relevantChunks.map(chunk => ({
        text: chunk.text,
        start: chunk.start,
        end: chunk.end,
        similarity: chunk.similarity,
        metadata: chunk.metadata
      })),
      searchMetadata: {
        totalChunks: document.chunks.length,
        searchedChunks: relevantChunks.length,
        maxSimilarity: relevantChunks.length > 0 ? relevantChunks[0].similarity : 0
      }
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
  console.log('🚀 Advanced Document Q&A Server Started');
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌐 API available at: http://localhost:${PORT}`);
  console.log('🔧 Features:');
  console.log('   ✅ PDF Upload & Processing');
  console.log('   ✅ Vector Database & Semantic Search');
  console.log('   ✅ AI Agent with System Prompts');
  console.log('   ✅ PDF Viewer Support');
  console.log('   ✅ Smart Text Chunking');
  console.log('📋 Endpoints:');
  console.log('   POST /api/upload - Upload & vectorize PDF');
  console.log('   GET  /api/documents - List documents');
  console.log('   GET  /api/documents/:id/pdf - Serve PDF file');
  console.log('   POST /api/ask - AI Agent Q&A');
  console.log('   GET  /api/health - Health check');
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️  GEMINI_API_KEY not set - Using text-based fallbacks');
    console.log('🔑 Get your free API key from: https://aistudio.google.com/');
  } else {
    console.log('✅ Gemini AI ready for intelligent responses');
  }
  
  console.log('🎯 Ready for advanced document analysis!');
});