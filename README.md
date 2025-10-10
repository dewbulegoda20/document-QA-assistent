# Document Q&A Application

A full-stack web application that allows users to upload PDF documents and ask questions about their content using AI. The application provides intelligent answers with 3. Verify your Gemini API key is valid and has sufficient quotaighlighted references to the source material.

## Features

- **Document Upload**: Support for PDF file uploads (up to 10MB)
- **AI-Powered Q&A**: Ask natural language questions about document content
- **Reference Highlighting**: See exactly where in the document the AI found relevant information
- **Split-Pane Interface**: Chat interface on the left, document viewer on the right
- **Real-time Processing**: Documents are processed and indexed for semantic search

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React PDF** for document viewing
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **Google Gemini API** for embeddings and chat completion
- **PDF-Parse** for text extraction
- **Multer** for file uploads
- **CORS** for cross-origin requests

## Prerequisites

Before running the application, you need:

1. **Node.js** (version 16 or higher)
2. **Google Gemini API Key** - Get one free from [Google AI Studio](https://aistudio.google.com)

## Installation

1. **Clone and navigate to the project:**
   ```bash
   cd f:/Documentation_Refe
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables:**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit the `.env` file and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3001
   ```

## Running the Application

### Development Mode (Recommended)

Run both frontend and backend simultaneously:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend development server on http://localhost:3000

### Individual Services

Run backend only:
```bash
npm run dev:backend
```

Run frontend only:
```bash
npm run dev:frontend
```

### Production Build

Build the frontend for production:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Usage

1. **Open the application** in your browser at http://localhost:3000

2. **Upload a PDF document:**
   - Drag and drop a PDF file onto the upload area
   - Or click "Choose File" to browse for a file
   - Wait for the document to be processed (this includes text extraction and AI indexing)

3. **Ask questions:**
   - Type your question in the chat input at the bottom left
   - Questions can be about specific topics, summaries, or details from the document
   - The AI will provide answers based on the document content

4. **View references:**
   - Click on any AI response to highlight the relevant text sections in the document viewer
   - Yellow highlights show where the AI found supporting information
   - The document viewer supports zooming and page navigation for PDF files

## Example Questions

Try asking questions like:
- "What is this document about?"
- "Summarize the main points"
- "What are the key findings?"
- "Explain the methodology"
- "What conclusions are drawn?"

## API Endpoints

### Backend API

- `POST /api/upload` - Upload and process a PDF document
- `GET /api/documents` - List all uploaded documents
- `GET /api/documents/:id` - Get specific document content
- `POST /api/ask` - Ask a question about a document

## Project Structure

```
f:/Documentation_Refe/
├── package.json                 # Root package.json for scripts
├── backend/                     # Node.js Express server
│   ├── package.json
│   ├── index.js                # Main server file
│   ├── .env.example            # Environment variables template
│   └── uploads/                # Directory for uploaded files
└── frontend/                   # React TypeScript application
    ├── package.json
    ├── vite.config.ts          # Vite configuration
    ├── tsconfig.json           # TypeScript configuration
    ├── tailwind.config.js      # Tailwind CSS configuration
    ├── index.html
    └── src/
        ├── App.tsx             # Main application component
        ├── main.tsx            # Application entry point
        ├── index.css           # Global styles
        └── components/         # React components
            ├── FileUpload.tsx      # Document upload component
            ├── ChatInterface.tsx   # Chat UI component
            └── DocumentViewer.tsx  # PDF viewer with highlighting
```

## Environment Variables

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Your Google Gemini API key for AI features |
| `PORT` | No | Server port (default: 3001) |

## Troubleshooting

### Common Issues

1. **"Gemini API key not set" error:**
   - Make sure you've created a `.env` file in the `backend` directory
   - Add your Gemini API key to the file
   - Restart the backend server

2. **Document upload fails:**
   - Ensure the file is a PDF and under 10MB
   - Check that the backend server is running
   - Verify the uploads directory exists and is writable

3. **PDF not displaying:**
   - The application will fall back to text-only view
   - Check browser console for PDF.js errors
   - Ensure the PDF is not password-protected or corrupted

4. **Slow response times:**
   - Gemini API calls can take a few seconds
   - Large documents require more processing time
   - Check your internet connection for API access

### Getting Help

If you encounter issues:

1. Check the browser console for frontend errors
2. Check the backend console for server errors
3. Verify all dependencies are installed correctly
4. Ensure your OpenAI API key is valid and has sufficient credits

## License

MIT License - see LICENSE file for details