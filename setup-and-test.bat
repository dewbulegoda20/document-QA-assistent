@echo off
echo.
echo ======================================
echo   Document Q&A App Setup & Test
echo ======================================
echo.

echo Step 1: Testing Backend Server...
cd backend
start "Backend Server" cmd /k "npm run dev"
timeout /t 3

echo.
echo Step 2: Testing Server Connection...
cd ..
node test-server.js

echo.
echo Step 3: Setup Instructions
echo.
echo IMPORTANT: Before using the app, you need to:
echo 1. Get an OpenAI API key from https://platform.openai.com
echo 2. Edit backend\.env file and add your API key
echo 3. Replace 'your_openai_api_key_here' with your actual key
echo.
echo To start the application:
echo 1. Backend: cd backend && npm run dev
echo 2. Frontend: cd frontend && npm run dev (after installing dependencies)
echo 3. Open http://localhost:3000 in your browser
echo.
echo For detailed setup instructions, see QUICK_START.md
echo.
pause