# 🚨 Railway Deployment Fix - "No such file or directory"

## ❌ The Error You're Seeing

```
/bin/bash: line 1: cd: backend: No such file or directory
ERROR: failed to build: failed to solve: process "/bin/bash -ol pipefail -c cd backend && npm install" did not complete successfully: exit code: 1
```

## 🔍 Root Cause

Railway is auto-generating a build command that tries to `cd backend`, but when you set **Root Directory: backend** in Railway settings, the build process is ALREADY inside the backend folder. So it's trying to go to `/backend/backend/` which doesn't exist!

## ✅ The Fix (Follow These Steps)

### Step 1: Commit the New Configuration File

```bash
git add backend/nixpacks.toml
git commit -m "Add nixpacks configuration for Railway deployment"
git push
```

### Step 2: Configure Railway Project Settings

Go to your Railway project and configure these settings:

#### **Option A: Using Root Directory (Recommended)**

1. Click on your service in Railway
2. Go to **Settings** tab
3. Set **Root Directory**: `backend`
4. Go to **Variables** tab and ensure these are set:
   ```
   GEMINI_API_KEY=your_api_key_here
   FRONTEND_URL=your_vercel_url
   NODE_ENV=production
   ```
5. The `nixpacks.toml` file will handle the rest!

#### **Option B: Deploy from Project Root**

If you prefer NOT to use Root Directory:

1. **Remove** the Root Directory setting (leave it empty)
2. Delete `backend/nixpacks.toml`
3. Create `nixpacks.toml` in the PROJECT ROOT instead:

```toml
[phases.setup]
nixPkgs = ['nodejs_18', 'npm-9_x']

[phases.install]
cmds = ['npm ci']

[phases.build]
cmds = ['cd backend && npm install']

[start]
cmd = 'cd backend && node index.js'
```

### Step 3: Trigger Redeploy

Railway should automatically redeploy when you push. If not:
1. Go to Railway → Your Service
2. Click **"Redeploy"**

---

## 📋 Complete Railway Configuration

Here's what your Railway settings should look like:

### Service Settings
- **Name**: document-qa-backend
- **Root Directory**: `backend` ✅
- **Start Command**: (leave empty, nixpacks.toml handles it)

### Environment Variables
```bash
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
PORT=3002  # Optional, Railway auto-assigns
```

### Files in backend/ folder
```
backend/
├── index.js
├── package.json
├── nixpacks.toml        ← NEW! This fixes the build
├── railway.json
├── Procfile
└── uploads/
```

---

## 🎯 Why This Works

**The Problem**: 
- Railway auto-generates: `cd backend && npm install`
- But with Root Directory = `backend`, you're already there!
- So it tries to go to `/backend/backend/` ❌

**The Solution**:
- `nixpacks.toml` explicitly tells Railway:
  - Don't try to `cd backend`
  - Just run `npm ci` in the current directory
  - Start with `node index.js`

---

## ✅ Verification Steps

After redeployment, check:

### 1. **Build Logs** (Should show):
```
✓ Setup complete
✓ Dependencies installed
✓ Build complete
✓ Starting server
```

### 2. **Deployment Logs** (Should show):
```
🚀 Document Q&A Server Started
📍 Server running on port 3002
🌐 API available at: http://localhost:3002
✅ Ready for document upload and processing!
```

### 3. **Health Check**:
```bash
curl https://your-backend.railway.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Backend is running",
  "port": 3002,
  "geminiAI": true
}
```

---

## 🐛 If It Still Fails

### Check 1: Root Directory Setting
- Railway → Settings → Root Directory
- Should be: `backend` (or empty if using Option B)

### Check 2: File Structure
Make sure your GitHub repo has:
```
your-repo/
├── backend/
│   ├── index.js
│   ├── package.json
│   ├── nixpacks.toml   ← Must exist!
│   └── ...
└── frontend/
    └── ...
```

### Check 3: Railway Build Logs
Look for the exact error:
- If it says "No such file": Root directory issue
- If it says "Module not found": Dependencies issue
- If it says "GEMINI_API_KEY not found": Environment variable issue

### Check 4: Node Version
Your app needs Node 18+. Railway uses Node 18.20.5, which is perfect.

---

## 🚀 Complete Deployment Checklist

- [ ] Created `backend/nixpacks.toml` file
- [ ] Committed and pushed to GitHub
- [ ] Set Root Directory to `backend` in Railway
- [ ] Added all environment variables in Railway
- [ ] Triggered redeploy
- [ ] Checked build logs (no errors)
- [ ] Tested health endpoint
- [ ] Updated `FRONTEND_URL` after frontend deployment

---

## 📞 Next Steps After Backend Works

1. **Get your Railway URL**:
   ```
   https://document-qa-backend-production-XXXX.up.railway.app
   ```

2. **Update frontend environment**:
   ```bash
   # Edit frontend/.env.production
   VITE_API_URL=https://your-railway-url.railway.app
   ```

3. **Deploy frontend to Vercel**:
   - Import GitHub repo
   - Root Directory: `frontend`
   - Add environment variable: `VITE_API_URL`

4. **Update Railway CORS**:
   - Add `FRONTEND_URL` with your Vercel URL
   - Redeploy backend

---

## 💡 Pro Tips

1. **Don't mix configurations**: Either use Root Directory OR root-level nixpacks.toml, not both
2. **Check logs first**: Railway logs tell you exactly what went wrong
3. **Test locally**: Make sure `npm ci` and `node index.js` work in the backend folder
4. **Environment variables**: Always double-check they're set correctly

---

## 🎉 Success Indicators

You'll know it's working when:
1. ✅ Build completes without errors
2. ✅ Deployment shows "Running"
3. ✅ Health check returns 200 OK
4. ✅ Logs show "Server Started"
5. ✅ Frontend can connect and upload PDFs

---

**Ready?** Commit the `nixpacks.toml` file and push to GitHub. Railway will automatically redeploy! 🚀
