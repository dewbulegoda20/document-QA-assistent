@echo off
echo ================================================
echo   Document Q&A - Production Environment Setup
echo ================================================
echo.

set /p RAILWAY_URL="Enter your Railway backend URL (e.g., https://your-app.railway.app): "

if "%RAILWAY_URL%"=="" (
    echo Error: Railway URL cannot be empty!
    pause
    exit /b 1
)

echo.
echo Updating production environment file...
echo VITE_API_URL=%RAILWAY_URL%> frontend\.env.production

echo.
echo ✅ Success! Production environment configured.
echo.
echo Next steps:
echo 1. Commit changes: git add frontend/.env.production
echo 2. Push to GitHub: git push
echo 3. Deploy frontend to Vercel/Netlify
echo 4. Update FRONTEND_URL in Railway with your deployed frontend URL
echo.
echo See RAILWAY_DEPLOY.md for complete deployment guide.
echo.
pause
