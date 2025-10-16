# 🚂 Railway Deployment Guide

Complete step-by-step guide to deploy your Document Q&A application on Railway (backend) and Vercel/Netlify (frontend).

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ GitHub account
- ✅ Railway account (sign up at [railway.app](https://railway.app))
- ✅ Vercel or Netlify account (for frontend)
- ✅ Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)
- ✅ Code pushed to a GitHub repository

---

## 🔧 Part 1: Backend Deployment on Railway

### Step 1: Create New Railway Project

1. Go to [railway.app](https://railway.app) and log in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `document-QA-assistent`
5. Railway will detect it's a Node.js project automatically

### Step 2: Configure Railway Service

1. After creating the project, click on your service
2. Go to **Settings** tab
3. Configure the following:

#### Root Directory (Important!)
- Set **Root Directory** to: `backend`
- This tells Railway to deploy only the backend folder

#### Start Command
Railway should auto-detect, but verify:
```bash
node index.js
```

### Step 3: Set Environment Variables

In Railway, go to the **Variables** tab and add:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `GEMINI_API_KEY` | `your_actual_api_key` | Your Google Gemini API key |
| `PORT` | `3002` (optional) | Railway auto-assigns a port, but you can specify |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Your deployed frontend URL (add after frontend deployment) |

⚠️ **Important**: After you deploy your frontend, come back here and update `FRONTEND_URL`!

### Step 4: Deploy Backend

1. Click **"Deploy"** or push changes to your GitHub repo
2. Railway will automatically build and deploy
3. Wait for deployment to complete (usually 2-3 minutes)
4. Your backend will be available at: `https://your-app.railway.app`

### Step 5: Get Your Backend URL

1. Go to **Settings** tab in Railway
2. Under **Domains**, you'll see your app URL
3. **Copy this URL** - you'll need it for frontend deployment!
4. Example: `https://document-qa-backend-production.up.railway.app`

### Step 6: Test Backend Health

Open your browser and visit:
```
https://your-app.railway.app/api/health
```

You should see:
```json
{
  "status": "ok",
  "message": "Backend is running",
  "port": 3002,
  "geminiAI": true,
  "embeddings": false
}
```

✅ If you see this, your backend is working!

---

## 🎨 Part 2: Frontend Deployment on Vercel

### Step 1: Prepare Frontend Environment

Before deploying, update your production environment file:

1. Open `frontend/.env.production`
2. Replace the placeholder with your Railway backend URL:
```env
VITE_API_URL=https://your-app.railway.app
```

3. Commit and push this change:
```bash
git add frontend/.env.production
git commit -m "Update production API URL"
git push
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Set Environment Variables in Vercel

In Vercel project settings, add:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://your-app.railway.app` |

### Step 4: Deploy Frontend

1. Click **"Deploy"**
2. Wait for build to complete (2-3 minutes)
3. Your frontend will be available at: `https://your-project.vercel.app`

### Step 5: Update Railway CORS

Now that you have your frontend URL, go back to Railway:

1. Open your Railway project
2. Go to **Variables** tab
3. Update or add `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-project.vercel.app
   ```
4. Railway will automatically redeploy with the new variable

---

## 🔄 Alternative: Deploy Frontend to Netlify

If you prefer Netlify over Vercel:

### Step 1: Prepare for Netlify

1. Update `frontend/.env.production` with your Railway URL
2. Create `frontend/netlify.toml`:
```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Step 2: Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) and log in
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose your GitHub repository
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

### Step 3: Environment Variables

In Netlify, go to **Site settings** → **Environment variables**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-app.railway.app` |

### Step 4: Deploy and Update Railway

1. Deploy on Netlify
2. Copy your Netlify URL: `https://your-site.netlify.app`
3. Update `FRONTEND_URL` in Railway with your Netlify URL

---

## ✅ Verification Checklist

After deploying both frontend and backend:

### Backend Checks
- [ ] Visit `https://your-backend.railway.app/api/health`
- [ ] Should return status "ok"
- [ ] Check Railway logs for any errors
- [ ] Verify `GEMINI_API_KEY` is set correctly

### Frontend Checks
- [ ] Visit your frontend URL
- [ ] Open browser DevTools → Console
- [ ] Check for CORS errors (should be none)
- [ ] Try uploading a PDF document
- [ ] Ask a question and verify AI response

### Integration Checks
- [ ] Upload a PDF successfully
- [ ] See document in viewer
- [ ] Ask questions and get AI responses
- [ ] Click on references to see highlighting
- [ ] Check browser Network tab - API calls should go to Railway backend

---

## 🐛 Troubleshooting

### Issue 1: CORS Error

**Symptom**: Browser console shows CORS error when uploading or asking questions

**Solution**:
1. Check Railway environment variables
2. Ensure `FRONTEND_URL` matches your exact frontend URL (no trailing slash)
3. Redeploy backend after changing variables

### Issue 2: 404 on API Calls

**Symptom**: Frontend says "Failed to upload" or "Failed to get answer"

**Solution**:
1. Verify `VITE_API_URL` in frontend environment variables
2. Check it matches your Railway backend URL exactly
3. Rebuild and redeploy frontend

### Issue 3: Backend Fails to Start

**Symptom**: Railway shows "deployment failed" or constant restarts

**Solution**:
1. Check Railway logs (click on deployment)
2. Common issues:
   - Missing `GEMINI_API_KEY`
   - Wrong root directory (should be `backend`)
   - Missing dependencies (run `npm install` in backend)

### Issue 4: PDF Processing Fails

**Symptom**: Upload succeeds but document won't display

**Solution**:
1. Check Railway logs for PDF parsing errors
2. Ensure `pdfjs-dist` is in `backend/package.json` dependencies
3. Verify file size is under 10MB

### Issue 5: AI Not Working

**Symptom**: Questions return empty or error messages

**Solution**:
1. Verify Gemini API key is valid
2. Check Railway logs for API errors
3. Ensure you're using `gemini-2.5-flash` model
4. Get new API key from [Google AI Studio](https://aistudio.google.com/)

---

## 🔐 Security Best Practices

### Environment Variables
- ✅ Never commit `.env` files to Git
- ✅ Use different API keys for development and production
- ✅ Rotate API keys periodically
- ✅ Set `FRONTEND_URL` to exact domain (not wildcard)

### CORS Configuration
- ✅ Set specific frontend URL in Railway
- ✅ Don't use `*` in production
- ✅ Update `FRONTEND_URL` if you change domains

### API Keys
- ✅ Keep Gemini API key secret
- ✅ Monitor API usage on Google AI Studio
- ✅ Set up usage alerts if available

---

## 📊 Monitoring Your Application

### Railway Monitoring
1. Go to your Railway project
2. Click on **Metrics** tab
3. Monitor:
   - Request count
   - Response times
   - Memory usage
   - CPU usage

### Vercel/Netlify Analytics
1. Enable analytics in your platform
2. Monitor:
   - Page views
   - Load times
   - Error rates

### Check Logs
**Railway**:
- Click on your service → **Logs** tab
- Filter by time or search for errors

**Vercel**:
- Go to project → **Functions** → **Logs**

---

## 🚀 Going Further

### Custom Domain
**Railway**:
1. Go to Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

**Vercel/Netlify**:
1. Go to Settings → Domains
2. Add custom domain
3. Update DNS records

### Auto-Deployment
Both Railway and Vercel/Netlify support auto-deployment:
- Push to `main` branch = automatic deployment
- Create different branches for staging
- Use pull requests for testing before merge

### Scaling
**Railway**:
- Automatically scales based on traffic
- Can upgrade plan for more resources

**Vercel/Netlify**:
- Automatic scaling with CDN
- Serverless functions scale automatically

---

## 📝 Quick Reference

### Important URLs

| Service | URL Format | Example |
|---------|-----------|---------|
| Railway Backend | `https://your-app.railway.app` | `https://doc-qa.railway.app` |
| Vercel Frontend | `https://your-project.vercel.app` | `https://doc-qa.vercel.app` |
| Netlify Frontend | `https://your-site.netlify.app` | `https://doc-qa.netlify.app` |

### Environment Variables Summary

**Backend (Railway)**:
```bash
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=https://your-frontend-url.vercel.app
PORT=3002  # Optional
```

**Frontend (Vercel/Netlify)**:
```bash
VITE_API_URL=https://your-backend.railway.app
```

### Common Commands

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build frontend
cd frontend && npm run build

# Test backend
curl https://your-backend.railway.app/api/health

# Check environment
echo $VITE_API_URL
```

---

## 🎉 Success!

If you've followed all steps, your Document Q&A application should now be:
- ✅ Live on the internet
- ✅ Backend running on Railway
- ✅ Frontend hosted on Vercel/Netlify
- ✅ Connected and working together
- ✅ Ready to handle document uploads and AI-powered Q&A

### Test Your Deployment
1. Visit your frontend URL
2. Upload a sample PDF
3. Ask: "What is this document about?"
4. See AI-powered answer with highlighted references

**Congratulations! Your app is live! 🎊**

---

## 📞 Need Help?

If you encounter issues:

1. **Check Logs**: Railway and Vercel/Netlify both have detailed logs
2. **Review Checklist**: Go through the verification checklist above
3. **Common Issues**: Review the troubleshooting section
4. **Test Locally First**: Ensure everything works locally before debugging deployment

Remember: Most deployment issues are related to:
- ❌ Wrong environment variables
- ❌ Incorrect API URLs
- ❌ Missing dependencies
- ❌ CORS configuration

Double-check these first! 🔍
