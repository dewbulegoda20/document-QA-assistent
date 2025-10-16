const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Helper function to extract text from PDF using pdfjs
async function extractTextFromPDF(buffer) {
  try {
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({
      data: data,
      verbosity: 0, // Suppress warnings
      isEvalSupported: false,
      useSystemFonts: false,
      disableFontFace: true
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    
    return {
      text: fullText.trim(),
      numPages: pdf.numPages
    };
  } catch (error) {
    console.error('pdfjs extraction failed:', error.message);
    throw error;
  }
}

const app = express();
// Use Railway's PORT environment variable or fallback to 3002 for local dev
const PORT = process.env.PORT || 3002;

// In-memory storage
const documents = new Map();

// Initialize Gemini AI with better error handling
let model = null;
let embeddingModel = null;

async function initializeGemini() {
  try {
    console.log('🔍 Initializing Gemini AI...');
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    
    console.log('🔑 API Key found, loading model...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use the CORRECT model name: gemini-2.5-flash (latest available model)
    console.log('📦 Loading gemini-2.5-flash model...');
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Test the model with a simple call
    console.log('🧪 Testing model with simple query...');
    const testResult = await model.generateContent('Say hello in one word');
    const testText = testResult.response.text();
    console.log('✅ Model test successful:', testText);
    
    console.log('✅ Gemini AI initialized successfully with gemini-2.5-flash model');
    return true;
  } catch (error) {
    console.error('❌ Gemini AI initialization failed:', error.message);
    if (error.message.includes('404')) {
      console.log('💡 Solution: Get a NEW API key from https://aistudio.google.com/ (NOT from GCP Console)');
      console.log('📋 Use model name: gemini-pro (not gemini-1.5-flash or gemini-pro-latest)');
    }
    console.log('⚠️  Running without AI features - will use intelligent text search instead');
    model = null;
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
    let pdfData, text, numPages;
    
    try {
      // First try with pdfjs-dist (most reliable)
      console.log('📖 Trying pdfjs-dist extraction...');
      const result = await extractTextFromPDF(fileBuffer);
      text = result.text;
      numPages = result.numPages;
      
      if (!text || text.trim().length < 100) {
        throw new Error('Extracted text is too short');
      }
      
      console.log(`✅ pdfjs extraction successful: ${text.length} characters, ${numPages} pages`);
      pdfData = { numpages: numPages };
      
    } catch (pdfjsError) {
      console.log('⚠️  pdfjs extraction failed:', pdfjsError.message);
      
      // Fallback to pdf-parse
      try {
        console.log('🔄 Trying pdf-parse extraction...');
        pdfData = await pdfParse(fileBuffer, {
          max: 0 // parse all pages
        });
        text = pdfData.text;
        
        if (text && text.trim().length > 50) {
          console.log(`✅ pdf-parse extraction succeeded: ${text.length} characters`);
        } else {
          throw new Error('pdf-parse extraction insufficient');
        }
      } catch (fallbackError) {
        console.log('❌ All PDF extraction methods failed');
        // Last resort: just store the file for viewing
        text = "PDF content extraction failed. File is available for viewing, but text search and AI features will be limited.";
        console.log(`⚠️  Using fallback message`);
        pdfData = { numpages: 1 };
      }
    }
    
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

// Basic ask endpoint with AI integration
app.post('/api/ask', async (req, res) => {
  try {
    const { question, documentId } = req.body;
    
    console.log('📝 Question received:', question);
    console.log('📄 Document ID:', documentId);
    
    if (!question || !documentId) {
      return res.status(400).json({ 
        success: false,
        error: 'Question and document ID are required' 
      });
    }
    
    const document = documents.get(documentId);
    if (!document) {
      return res.status(404).json({ 
        success: false,
        error: 'Document not found' 
      });
    }
    
    console.log('📋 Document found:', document.filename);
    
    // Try AI processing if available
    if (model && document.text) {
      try {
        console.log('🤖 Processing with Gemini AI...');
        
        // Enhanced system prompt with explicit citation requirements
        const prompt = `You are an intelligent document analysis assistant. Analyze the document and answer questions with well-formatted markdown AND explicit citations.

DOCUMENT: "${document.filename}"

CONTENT:
${document.text}

QUESTION: ${question}

INSTRUCTIONS:
1. Provide a comprehensive answer based ONLY on the document content
2. Format your response in markdown:
   - Use **bold** for emphasis
   - Use bullet points (- ) for lists
   - Use numbered lists (1. ) for sequential items
   - Use headings (## ) for major sections if needed
3. Structure your answer clearly with relevant context
4. **CRITICAL**: At the END of your answer, add a section called "CITATIONS" where you list the EXACT text snippets from the document that you used to answer this question
   - Use this exact format:
   
---
CITATIONS:
[CITE]exact text from document 1[/CITE]
[CITE]exact text from document 2[/CITE]
[CITE]exact text from document 3[/CITE]

5. The citations should be verbatim text from the document (word-for-word), at least 20-50 characters long
6. Only cite the specific parts you actually referenced to answer the question
7. If information is not in the document, state: "This information is not mentioned in the document."

ANSWER:`;

        console.log('📊 Prompt length:', prompt.length);
        console.log('📤 Calling Gemini API with gemini-2.5-flash model...');
        const result = await model.generateContent(prompt);
        console.log('📥 Gemini API response received');
        const fullResponse = result.response.text();
        console.log('📝 AI Full Response:', fullResponse.substring(0, 150) + '...');
        
        // Extract answer and citations
        let answer = fullResponse;
        const relevantChunks = [];
        
        // Check if response contains CITATIONS section
        const citationMatch = fullResponse.match(/---\s*CITATIONS:\s*([\s\S]*)/i);
        
        if (citationMatch) {
          // Split answer and citations
          answer = fullResponse.substring(0, citationMatch.index).trim();
          const citationsText = citationMatch[1];
          
          console.log('📚 Extracting citations from AI response...');
          
          // Extract all [CITE]...[/CITE] blocks
          const citePattern = /\[CITE\]([\s\S]*?)\[\/CITE\]/gi;
          let match;
          
          while ((match = citePattern.exec(citationsText)) !== null) {
            const citedText = match[1].trim();
            console.log('🔍 Looking for citation:', citedText.substring(0, 50) + '...');
            
            // Find this exact text in the document
            const startPos = document.text.indexOf(citedText);
            
            if (startPos !== -1) {
              // Found exact match
              console.log('✅ Found exact citation at position', startPos);
              
              // Calculate page number based on character position
              const totalChars = document.text.length;
              const totalPages = document.metadata?.pageCount || 1;
              const estimatedPage = Math.max(1, Math.min(totalPages, Math.ceil((startPos / totalChars) * totalPages)));
              
              relevantChunks.push({
                text: citedText,
                start: startPos,
                end: startPos + citedText.length,
                score: 1.0,
                similarity: 1.0,
                page: estimatedPage
              });
            } else {
              // Try fuzzy matching - look for substantial overlap
              console.log('⚠️  Exact citation not found, trying fuzzy match...');
              const citedWords = citedText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
              const docLower = document.text.toLowerCase();
              
              // Find sections with high word overlap
              let bestMatch = null;
              let bestScore = 0;
              
              // Slide a window through the document
              const windowSize = citedText.length;
              for (let i = 0; i < document.text.length - windowSize; i += 50) {
                const window = document.text.substring(i, i + windowSize * 2);
                const windowLower = window.toLowerCase();
                
                let matchCount = 0;
                citedWords.forEach(word => {
                  if (windowLower.includes(word)) matchCount++;
                });
                
                const matchRatio = matchCount / citedWords.length;
                if (matchRatio > bestScore && matchRatio > 0.6) {
                  bestScore = matchRatio;
                  bestMatch = {
                    text: window.substring(0, Math.min(window.length, citedText.length * 1.5)),
                    start: i,
                    end: i + Math.min(window.length, citedText.length * 1.5)
                  };
                }
              }
              
              if (bestMatch) {
                console.log('✅ Found fuzzy match with score', bestScore);
                
                // Calculate page number based on character position
                const totalChars = document.text.length;
                const totalPages = document.metadata?.pageCount || 1;
                const estimatedPage = Math.max(1, Math.min(totalPages, Math.ceil((bestMatch.start / totalChars) * totalPages)));
                
                relevantChunks.push({
                  ...bestMatch,
                  score: bestScore,
                  similarity: bestScore,
                  page: estimatedPage
                });
              } else {
                console.log('❌ Could not find citation in document');
              }
            }
          }
          
          console.log('📍 Extracted', relevantChunks.length, 'citations from AI response');
        } else {
          console.log('⚠️  No CITATIONS section found in AI response, falling back to keyword search');
          
          // Fallback: extract relevant chunks using keyword matching
          const questionLower = question.toLowerCase();
          const questionWords = questionLower.split(/\s+/).filter(word => word.length > 3);
          
          // Split into sections
          let sections = document.text.split(/\n(?=\d+\.\s+[A-Z])/);
          if (sections.length === 1) {
            sections = document.text.split(/\n\n+/);
          }
          
          sections.forEach((section) => {
            const sectionText = section.trim();
            if (sectionText.length < 30) return;
            
            const lowerSection = sectionText.toLowerCase();
            let relevanceScore = 0;
            
            questionWords.forEach(word => {
              if (lowerSection.includes(word)) {
                relevanceScore += 0.3;
              }
            });
            
            if (relevanceScore > 0.5) {
              const startPos = document.text.indexOf(sectionText);
              
              // Calculate page number based on character position
              const totalChars = document.text.length;
              const totalPages = document.metadata?.pageCount || 1;
              const estimatedPage = startPos > -1 
                ? Math.max(1, Math.min(totalPages, Math.ceil((startPos / totalChars) * totalPages)))
                : 1;
              
              relevantChunks.push({
                text: sectionText.substring(0, 300),
                start: startPos > -1 ? startPos : 0,
                end: startPos > -1 ? startPos + Math.min(sectionText.length, 300) : 300,
                score: Math.min(relevanceScore, 1.0),
                similarity: relevanceScore,
                page: estimatedPage
              });
            }
          });
          
          relevantChunks.sort((a, b) => b.similarity - a.similarity);
        }
        
        console.log('✅ AI response processed with', relevantChunks.length, 'relevant chunks');
        
        // Debug: Log first chunk's page number
        if (relevantChunks.length > 0) {
          console.log('📄 First chunk page:', relevantChunks[0].page, 'of', document.metadata?.pageCount);
        }
        
        res.json({
          success: true,
          answer: answer || 'No answer could be generated.',
          relevantChunks: relevantChunks.slice(0, 10) || [],
          metadata: {
            chunksFound: relevantChunks.length,
            maxRelevance: relevantChunks.length > 0 ? relevantChunks[0].score : 0,
            citationsExtracted: citationMatch ? true : false
          }
        });
        
      } catch (aiError) {
        console.error('❌ AI processing error:', aiError);
        // Fallback to simple response
        res.json({
          success: true,
          answer: `I can see your document **"${document.filename}"** but encountered an AI processing error. Please try asking your question again.`,
          relevantChunks: []
        });
      }
    } else {
      console.log('⚠️  AI not available, providing intelligent text search');
      
      // Intelligent text search when AI is not available
      const questionLower = question.toLowerCase(); // Define at the top
      const relevantChunks = [];
      
      if (document.text) {
        const searchTerms = [
          'client', 'concern', 'issue', 'problem', 'objective', 'background',
          'dispute', 'matter', 'legal', 'contract', 'agreement', 'claim'
        ];
        
        // Split text into sentences
        const sentences = document.text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        
        sentences.forEach((sentence, index) => {
          const sentenceLower = sentence.toLowerCase();
          let relevanceScore = 0;
          
          // Check for question keywords
          const questionWords = questionLower.split(' ').filter(w => w.length > 3);
          questionWords.forEach(word => {
            if (sentenceLower.includes(word)) {
              relevanceScore += 0.3;
            }
          });
          
          // Check for legal document keywords
          searchTerms.forEach(term => {
            if (sentenceLower.includes(term)) {
              relevanceScore += 0.4;
            }
          });
          
          if (relevanceScore > 0.3) {
            const startPos = document.text.indexOf(sentence.trim());
            relevantChunks.push({
              text: sentence.trim(),
              start: startPos > -1 ? startPos : index * 100,
              end: startPos > -1 ? startPos + sentence.trim().length : (index * 100) + sentence.trim().length,
              score: Math.round(relevanceScore * 100) / 100,
              similarity: relevanceScore
            });
          }
        });
        
        // Sort by relevance
        relevantChunks.sort((a, b) => b.similarity - a.similarity);
      }
      
      const topChunks = relevantChunks.slice(0, 3);
      console.log('📍 Found', topChunks.length, 'relevant sections using text search');
      
      // Generate a helpful response based on found chunks
      let answer = `Based on the document "${document.filename}", `;
      
      if (topChunks.length > 0) {
        if (questionLower.includes('concern') || questionLower.includes('client')) {
          answer += `I found ${topChunks.length} relevant sections about client concerns. The key issues appear to be related to the content highlighted below. `;
        } else if (questionLower.includes('background')) {
          answer += `I found ${topChunks.length} sections related to the background of the issue. Please see the highlighted sections for details.`;
        } else {
          answer += `I found ${topChunks.length} relevant sections that may answer your question. Please review the highlighted content below.`;
        }
      } else {
        answer += `I can see your document contains information, but I couldn't find specific sections matching your question. You may want to try rephrasing your question or look through the document manually.`;
      }
      
      res.json({
        success: true,
        answer: answer,
        relevantChunks: topChunks || []
      });
    }
    
  } catch (error) {
    console.error('❌ Ask error:', error);
    console.error('❌ Ask error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process question: ' + error.message,
      relevantChunks: []
    });
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