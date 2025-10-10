@echo off
echo Starting Document Q&A Application...

echo.
echo Starting Backend Server...
start /min "Backend Server" cmd /k "cd /d f:\Documentation_Refe\backend && node index.js"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo Starting Frontend Server...
start /min "Frontend Server" cmd /k "cd /d f:\Documentation_Refe\frontend && npx vite"

echo.
echo Both servers are starting...
echo Frontend will be available at: http://localhost:3000
echo Backend will be available at: http://localhost:3002
echo.
echo Check the minimized windows for server status.
echo Press any key to exit this script (servers will continue running)...
pause > nul