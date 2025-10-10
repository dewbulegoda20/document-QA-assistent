# Quick Start Guide

## 🚀 Getting Started

Your Document Q&A application is now ready! Here's how to get it running:

## ⚠️ IMPORTANT: Set up Gemini API Key First

1. **Get a Google Gemini API Key:**
   - Go to [Google AI Studio](https://aistudio.google.com)
   - Sign up or log in with your Google account
   - Click "Get API Key" in the left sidebar
   - Create a new API key for your project

2. **Configure the backend:**
   ```bash
   cd backend
   # Edit the .env file and replace 'your_gemini_api_key_here' with your actual API key
   notepad .env
   ```

## 🛠️ Installation & Setup

### Option 1: Manual Setup (Recommended due to npm issues)

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Install frontend dependencies manually:**
   ```bash
   cd ../frontend
   npm init -y
   npm install react@18.2.0 react-dom@18.2.0
   npm install -D vite@4.4.0 @vitejs/plugin-react@4.0.0
   npm install -D typescript@5.0.0 @types/react@18.2.0 @types/react-dom@18.2.0
   npm install -D tailwindcss@3.3.0 autoprefixer@10.4.0 postcss@8.4.0
   npm install lucide-react@0.292.0 react-pdf@7.5.1 clsx@2.0.0
   ```

### Option 2: Quick Test (Backend Only)

If frontend setup is problematic, you can test the backend API directly:

```bash
cd backend
npm start
```

Then test with curl or Postman:
- Upload endpoint: `POST http://localhost:3001/api/upload`
- Ask endpoint: `POST http://localhost:3001/api/ask`

## 🚀 Running the Application

### Start Backend:
```bash
cd backend
npm run dev
# OR
node index.js
```

### Start Frontend (in new terminal):
```bash
cd frontend
npm run dev
```

### Access the app:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🧪 Testing the Application

1. **Open** http://localhost:3000 in your browser
2. **Upload** a PDF document (drag & drop or click to browse)
3. **Wait** for processing (you'll see a loading spinner)
4. **Ask questions** like:
   - "What is this document about?"
   - "Summarize the main points"
   - "What are the key findings?"
5. **View highlights** - Click on AI responses to see highlighted text in the document

## 🔧 Troubleshooting

### Backend Issues:
- **Gemini API errors**: Check your API key in `backend/.env`
- **Port 3001 in use**: Change PORT in `backend/.env`
- **Upload errors**: Ensure `backend/uploads/` directory exists

### Frontend Issues:
- **Dependencies**: Try manual installation steps above
- **Port 3000 in use**: Vite will automatically suggest another port
- **PDF not loading**: Application falls back to text view

### Common Fixes:
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check if backend is running
curl http://localhost:3001/api/documents
```

## 📁 Project Structure

```
F:/Documentation_Refe/
├── backend/           # Node.js Express server
│   ├── index.js      # Main server file
│   ├── .env          # Environment variables (ADD YOUR GEMINI KEY HERE!)
│   └── uploads/      # Uploaded documents storage
├── frontend/         # React application
│   ├── src/
│   │   ├── App.tsx   # Main app component
│   │   └── components/
│   └── package.json
└── README.md         # Full documentation
```

## 🎯 Next Steps

1. **Add your Gemini API key** to `backend/.env`
2. **Test the backend** by running `npm run dev` in the backend directory
3. **Set up the frontend** using the manual steps above
4. **Upload a test PDF** and start asking questions!

## 💡 Sample Questions to Try

- "What is the main topic of this document?"
- "Can you summarize the key points?"
- "What methodology was used?"
- "What are the conclusions?"
- "Explain the results in simple terms"

## 🆘 Need Help?

Check the full `README.md` for detailed troubleshooting and setup instructions!