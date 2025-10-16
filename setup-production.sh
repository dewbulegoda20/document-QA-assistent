#!/bin/bash

echo "================================================"
echo "  Document Q&A - Production Environment Setup"
echo "================================================"
echo ""

read -p "Enter your Railway backend URL (e.g., https://your-app.railway.app): " RAILWAY_URL

if [ -z "$RAILWAY_URL" ]; then
    echo "Error: Railway URL cannot be empty!"
    exit 1
fi

echo ""
echo "Updating production environment file..."
echo "VITE_API_URL=$RAILWAY_URL" > frontend/.env.production

echo ""
echo "✅ Success! Production environment configured."
echo ""
echo "Next steps:"
echo "1. Commit changes: git add frontend/.env.production"
echo "2. Push to GitHub: git push"
echo "3. Deploy frontend to Vercel/Netlify"
echo "4. Update FRONTEND_URL in Railway with your deployed frontend URL"
echo ""
echo "See RAILWAY_DEPLOY.md for complete deployment guide."
echo ""
