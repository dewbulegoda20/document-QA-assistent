# 🚀 Quick Railway Deployment

Your backend deployment checklist for Railway.

## 📦 What's Been Fixed

✅ **Backend Dependencies**: Added `pdfjs-dist` for PDF processing  
✅ **CORS Configuration**: Updated to accept your frontend domain  
✅ **Environment Setup**: Created production environment files  
✅ **API Configuration**: All frontend components now use environment variables  

## ⚡ Quick Start (5 Minutes)

### 1️⃣ Deploy Backend to Railway

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project**
3. Select **Deploy from GitHub repo**
4. Choose your repo and configure:
   - **Root Directory**: `backend`
   - **Start Command**: `node index.js`

### 2️⃣ Set Environment Variables in Railway

Click **Variables** tab and add:
```
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=will_add_after_frontend_deployment
```

### 3️⃣ Get Your Backend URL

After deployment completes:
- Go to **Settings** → **Domains**
- Copy the URL (e.g., `https://your-app.railway.app`)

### 4️⃣ Update Frontend Configuration

Run this command and paste your Railway URL:
```bash
./setup-production.bat
```
Or manually edit `frontend/.env.production`:
```env
VITE_API_URL=https://your-railway-backend-url.railway.app
```

### 5️⃣ Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Configure:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-railway-backend-url.railway.app
   ```

### 6️⃣ Update Railway CORS

Go back to Railway and update:
```
FRONTEND_URL=https://your-frontend.vercel.app
```

## ✅ Test Your Deployment

Visit your frontend URL and:
1. Upload a PDF document
2. Ask a question
3. See AI-powered answer with highlighting

## 📚 Need More Details?

See [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) for:
- Complete step-by-step instructions
- Troubleshooting guide
- Security best practices
- Alternative deployment options (Netlify)

## 🐛 Common Issues

### CORS Error
**Fix**: Update `FRONTEND_URL` in Railway to match your exact frontend URL

### 404 on API Calls
**Fix**: Verify `VITE_API_URL` in frontend environment variables matches Railway URL

### Backend Won't Start
**Fix**: Check Railway logs and ensure `GEMINI_API_KEY` is set

### PDF Upload Fails
**Fix**: Ensure `pdfjs-dist` is in `backend/package.json` (✅ already added)

## 📞 Railway Support

Railway Docs: https://docs.railway.app/  
Railway Community: https://discord.gg/railway

---

**Ready to deploy?** Start with step 1 above! 🚀
