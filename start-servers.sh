#!/bin/bash
# Start backend
echo "Starting backend server..."
cd /f/Documentation_Refe/backend
node index.js &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Start frontend  
echo "Starting frontend server..."
cd /f/Documentation_Refe/frontend
npx vite &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo "Both servers started successfully!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3002"

# Keep script running
wait