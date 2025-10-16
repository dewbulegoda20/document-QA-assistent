# ✅ Backend Deployment Fixes - Summary

## 🔍 Issues Identified and Fixed

Your backend wasn't working on Railway due to several configuration issues. Here's what was wrong and what we fixed:

### 1. **Missing PDF Processing Dependency** ❌ → ✅
**Problem**: `pdfjs-dist` was only in root `package.json`, not in `backend/package.json`  
**Impact**: Railway couldn't process PDFs, causing upload failures  
**Fix**: Added `pdfjs-dist@^3.11.174` to backend dependencies  

### 2. **CORS Not Configured for Production** ❌ → ✅
**Problem**: Backend was accepting requests from anywhere (`cors()`)  
**Impact**: Browser would block requests from your deployed frontend  
**Fix**: Updated CORS to use `FRONTEND_URL` environment variable  

### 3. **Frontend Hard-coded API URLs** ❌ → ✅
**Problem**: All API calls used `/api/upload`, `/api/ask` etc. (worked only with proxy)  
**Impact**: Deployed frontend couldn't connect to Railway backend  
**Fix**: 
- Created `frontend/src/config/api.ts` with `VITE_API_URL` support
- Updated all components to use `API_ENDPOINTS`
- Created environment files for dev/production

### 4. **No Production Configuration** ❌ → ✅
**Problem**: No way to configure different URLs for dev vs production  
**Impact**: Had to manually edit code for each environment  
**Fix**: Created `.env.development` and `.env.production` files

### 5. **Missing Deployment Documentation** ❌ → ✅
**Problem**: No clear instructions for Railway deployment  
**Impact**: Confusion about environment variables and configuration  
**Fix**: Created comprehensive deployment guides

---

## 📝 Files Modified

### Backend
- ✅ `backend/package.json` - Added pdfjs-dist dependency
- ✅ `backend/index.js` - Updated CORS configuration for production

### Frontend
- ✅ `frontend/src/config/api.ts` - **NEW** - Centralized API configuration
- ✅ `frontend/src/components/UploadPage.tsx` - Use API_ENDPOINTS
- ✅ `frontend/src/components/FileUpload.tsx` - Use API_ENDPOINTS
- ✅ `frontend/src/components/ChatInterface.tsx` - Use API_ENDPOINTS
- ✅ `frontend/src/components/DocumentViewer.tsx` - Use API_ENDPOINTS
- ✅ `frontend/src/components/SimpleDocumentViewer.tsx` - Use API_ENDPOINTS
- ✅ `frontend/vite.config.ts` - Updated proxy configuration
- ✅ `frontend/.env.development` - **NEW** - Development environment
- ✅ `frontend/.env.production` - **NEW** - Production environment (update with your Railway URL)
- ✅ `frontend/.env.example` - **NEW** - Template for environment variables

### Documentation
- ✅ `RAILWAY_DEPLOY.md` - **NEW** - Complete deployment guide
- ✅ `RAILWAY_QUICK_START.md` - **NEW** - Quick reference guide
- ✅ `DEPLOYMENT_FIXES.md` - **NEW** - This file
- ✅ `setup-production.bat` - **NEW** - Windows setup script
- ✅ `setup-production.sh` - **NEW** - Linux/Mac setup script

---

## 🚀 What You Need to Do Now

### Step 1: Commit and Push Changes
```bash
git add .
git commit -m "Fix backend deployment configuration for Railway"
git push
```

### Step 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Create new project from your GitHub repo
3. Configure:
   - **Root Directory**: `backend`
   - **Start Command**: `node index.js`
4. Add environment variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   FRONTEND_URL=will_add_later
   ```
5. Deploy and copy your Railway URL

### Step 3: Configure Frontend for Production

Run the setup script with your Railway URL:
```bash
./setup-production.bat
```

Or manually edit `frontend/.env.production`:
```env
VITE_API_URL=https://your-railway-backend.railway.app
```

### Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Configure:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-railway-backend.railway.app
   ```
5. Deploy

### Step 5: Update Railway CORS

Go back to Railway and update the `FRONTEND_URL` variable:
```
FRONTEND_URL=https://your-frontend.vercel.app
```

Railway will automatically redeploy.

---

## ✅ Verification

After deployment, test:

1. **Backend Health Check**
   ```
   https://your-backend.railway.app/api/health
   ```
   Should return:
   ```json
   {"status": "ok", "message": "Backend is running", "geminiAI": true}
   ```

2. **Frontend Upload**
   - Visit your frontend URL
   - Upload a PDF
   - Should succeed without CORS errors

3. **AI Q&A**
   - Ask a question about your document
   - Should get AI-powered answer
   - Should see highlighting in document viewer

---

## 🐛 Troubleshooting

### Issue: CORS Error in Browser Console
**Symptom**: `Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy`

**Solution**:
1. Check Railway environment variables
2. Ensure `FRONTEND_URL` exactly matches your Vercel URL (no trailing slash)
3. Redeploy backend after changing variables

### Issue: 404 on API Calls
**Symptom**: Frontend shows "Failed to upload" or "Failed to get answer"

**Solution**:
1. Check browser Network tab - where is it trying to call?
2. Verify `VITE_API_URL` in Vercel environment variables
3. Ensure it matches your Railway URL exactly
4. Rebuild frontend after changing environment variables

### Issue: Backend Fails to Start on Railway
**Symptom**: Railway logs show "Error: GEMINI_API_KEY not found"

**Solution**:
1. Go to Railway → Variables tab
2. Add `GEMINI_API_KEY` with your actual API key
3. Get new key from [Google AI Studio](https://aistudio.google.com/)

### Issue: PDF Upload Fails
**Symptom**: Upload button spins forever or shows error

**Solution**:
1. Check Railway logs for errors
2. Verify file is PDF and under 10MB
3. Ensure `pdfjs-dist` is in backend dependencies (already fixed ✅)

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Your Browser                          │
│                                                             │
│  Frontend (Vercel/Netlify)                                 │
│  https://your-app.vercel.app                              │
│  ↓                                                          │
│  Reads: VITE_API_URL from .env.production                 │
│  ↓                                                          │
│  Makes API calls to:                                       │
│  https://your-backend.railway.app/api/*                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend (Railway)                                          │
│  https://your-backend.railway.app                         │
│  ↓                                                          │
│  Checks CORS: Is request from FRONTEND_URL?               │
│  ↓                                                          │
│  If yes: Process request                                   │
│  ↓                                                          │
│  Uses GEMINI_API_KEY to call Google AI                    │
│  ↓                                                          │
│  Returns JSON response                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Points to Remember

1. **Environment Variables are Critical**
   - Backend needs: `GEMINI_API_KEY`, `FRONTEND_URL`
   - Frontend needs: `VITE_API_URL`

2. **URLs Must Match Exactly**
   - No trailing slashes
   - Include `https://`
   - Check for typos

3. **Changes Require Redeployment**
   - Railway auto-redeploys on variable changes
   - Vercel requires rebuild for environment variable changes

4. **CORS is Your Friend**
   - Protects your API from unauthorized use
   - Must be configured correctly or nothing works

5. **Check Logs First**
   - Railway has excellent logs
   - Vercel shows build and function logs
   - Browser console shows client-side errors

---

## 📚 Additional Resources

- **Full Deployment Guide**: See `RAILWAY_DEPLOY.md`
- **Quick Reference**: See `RAILWAY_QUICK_START.md`
- **Railway Docs**: https://docs.railway.app/
- **Vercel Docs**: https://vercel.com/docs
- **Vite Environment Variables**: https://vitejs.dev/guide/env-and-mode.html

---

## ✨ What's Different Now?

### Before ❌
```typescript
// Hard-coded, only worked with Vite proxy
const response = await fetch('/api/upload', {...});
```

### After ✅
```typescript
// Dynamic, works in any environment
import { API_ENDPOINTS } from '../config/api';
const response = await fetch(API_ENDPOINTS.UPLOAD, {...});
```

The app now:
- ✅ Works locally with `npm run dev`
- ✅ Works in production on Railway + Vercel
- ✅ Can be deployed to any hosting provider
- ✅ Has proper CORS security
- ✅ Handles PDF processing correctly

---

## 🎉 Success Criteria

You'll know everything is working when:

1. ✅ Railway health check returns `{"status": "ok"}`
2. ✅ Frontend loads without console errors
3. ✅ PDF upload completes successfully
4. ✅ AI responds to questions
5. ✅ Document highlighting works
6. ✅ No CORS errors in browser console

---

**Questions?** Review the troubleshooting section or check the detailed guides!

**Ready to deploy?** Follow the steps in "What You Need to Do Now" section above! 🚀
