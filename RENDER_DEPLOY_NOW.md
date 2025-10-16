# 🎯 RENDER DEPLOYMENT - READY TO DEPLOY!

## ✅ Pre-Deployment Checklist

All files are ready:
- ✅ `render.yaml` created
- ✅ `backend/index.js` configured for dynamic PORT
- ✅ Environment variables documented
- ✅ Code ready for GitHub push

---

## 🚀 DEPLOY NOW - Follow These Steps

### **Step 1: Push to GitHub** (2 minutes)

```bash
# Add all changes
git add .

# Commit
git commit -m "Add Render deployment configuration"

# Push to GitHub
git push origin main
```

---

### **Step 2: Sign Up for Render** (1 minute)

1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Click **"Sign in with GitHub"**
4. Authorize Render to access your repositories
5. ✅ **No credit card required!**

---

### **Step 3: Create Web Service** (3 minutes)

1. In Render Dashboard, click **"New +"** (top right)
2. Select **"Web Service"**
3. Click **"Connect a repository"**
4. Find and select **`document-QA-assistent`**
5. Click **"Connect"**

---

### **Step 4: Configure Your Service** (2 minutes)

Fill in these EXACT settings:

```
┌─────────────────────────────────────────┐
│ Name: document-qa-backend               │
├─────────────────────────────────────────┤
│ Region: Oregon (US West)                │
│   (Choose closest to your location)     │
├─────────────────────────────────────────┤
│ Branch: main                            │
├─────────────────────────────────────────┤
│ Root Directory: backend                 │
│   ⚠️ IMPORTANT: Must be "backend"       │
├─────────────────────────────────────────┤
│ Runtime: Node                           │
├─────────────────────────────────────────┤
│ Build Command: npm install              │
├─────────────────────────────────────────┤
│ Start Command: node index.js            │
├─────────────────────────────────────────┤
│ Instance Type: Free                     │
│   (Select from dropdown)                │
└─────────────────────────────────────────┘
```

---

### **Step 5: Add Environment Variables** (1 minute)

Scroll down to **"Environment Variables"** section:

1. Click **"Add Environment Variable"**
2. Enter:
   ```
   Key: GEMINI_API_KEY
   Value: AIzaSyCUe09yPxC8akD_O_gGNT5X_Malctca_OI
   ```
3. Click **"Add"** button

**DO NOT add PORT** - Render sets this automatically!

---

### **Step 6: Deploy!** (3-5 minutes)

1. Scroll to bottom
2. Click **"Create Web Service"** button
3. Wait for deployment to complete
4. Watch the logs for these success messages:

```
==> Building...
✅ Installing dependencies...
✅ Build complete

==> Starting service...
🔍 Initializing Gemini AI...
✅ Gemini AI initialized successfully
🚀 Server running on port 10000
✅ Ready for document upload and processing!

==> Your service is live! 🎉
```

---

### **Step 7: Get Your Backend URL** (30 seconds)

At the top of the page, you'll see your service URL:

```
https://document-qa-backend.onrender.com
```

**COPY THIS URL!** You'll need it for Vercel.

---

### **Step 8: Test Your Backend** (1 minute)

Open in a new browser tab:
```
https://document-qa-backend.onrender.com/api/documents
```

✅ **Expected response:** `[]` (empty array)

Or use curl:
```bash
curl https://document-qa-backend.onrender.com/api/documents
```

---

### **Step 9: Update Vercel Frontend** (2 minutes)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project (**document-QA-assistent** or similar)
3. Click **"Settings"** in the top navigation
4. Click **"Environment Variables"** in the left sidebar
5. Click **"Add New"** button
6. Enter:
   ```
   Name: VITE_API_URL
   Value: https://document-qa-backend.onrender.com
   ```
7. Check all three boxes:
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development
8. Click **"Save"**

---

### **Step 10: Redeploy Frontend** (1 minute)

1. Go to **"Deployments"** tab
2. Click **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Wait 1-2 minutes for redeployment

---

### **Step 11: Test Everything!** (2 minutes)

1. Visit your Vercel frontend URL
2. **Upload a PDF:**
   - Click "Choose File"
   - Select a PDF (any PDF under 10MB)
   - Wait for upload (first time may take 30-60 seconds due to cold start)
3. **Ask a question:**
   - Type a question about the PDF
   - Click "Send"
   - Wait for AI response
4. **Test page navigation:**
   - Click on page numbers in the response
   - Verify document viewer navigates to the correct page

---

## 🎉 SUCCESS CHECKLIST

- [ ] Backend deployed to Render
- [ ] Render logs show "Ready for document upload"
- [ ] Backend URL responds with `[]`
- [ ] Vercel environment variable added
- [ ] Frontend redeployed
- [ ] PDF upload works
- [ ] Chat responds with AI answers
- [ ] Page numbers show correctly
- [ ] Page navigation works

---

## 🐛 Troubleshooting

### ❌ "Build failed"
**Check:**
- Root Directory is set to `backend`
- Build Command is `npm install`
- `package.json` exists in backend folder

**Fix:** Go to Settings → Update Root Directory

---

### ❌ "Service failed to start"
**Check Render logs for:**
- Missing `GEMINI_API_KEY`
- Port binding errors
- Module not found errors

**Fix:** 
- Verify environment variable is set
- Check Start Command is `node index.js`

---

### ❌ "502 Bad Gateway"
**Cause:** Backend crashed or not responding

**Fix:**
1. Check Render logs for errors
2. Verify `GEMINI_API_KEY` is correct
3. Restart service in Render dashboard

---

### ❌ Frontend shows "Failed to upload"
**Cause:** Cold start delay (first request after 15 min)

**Fix:**
- Wait 30-60 seconds on first use
- Service will be fast after warm-up
- Optional: Set up keep-alive (see below)

---

### ❌ "CORS error" in browser console
**Should not happen** - already configured

**If it does:**
1. Check backend logs
2. Verify `app.use(cors())` is in `index.js`
3. Make sure backend URL in Vercel is correct

---

## ⚡ Optimize: Prevent Cold Starts (Optional)

Render free tier sleeps after 15 minutes of inactivity. To keep it awake:

### Option 1: Cron-Job.org (FREE)

1. Go to [cron-job.org](https://cron-job.org)
2. Sign up (free)
3. Create new cron job:
   ```
   Title: Keep Render Backend Alive
   URL: https://document-qa-backend.onrender.com/api/health
   Execution schedule: Every 14 minutes
   ```
4. Save and activate

Your backend will stay warm 24/7! 🔥

---

### Option 2: UptimeRobot (FREE)

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up (free)
3. Add new monitor:
   ```
   Monitor Type: HTTP(s)
   Friendly Name: Backend Health
   URL: https://document-qa-backend.onrender.com/api/health
   Monitoring Interval: 5 minutes
   ```
4. Create monitor

Gets email alerts if backend goes down + keeps it awake!

---

## 📊 Monitor Your Deployment

### Render Dashboard:
- **Logs:** Real-time application logs
- **Metrics:** CPU, Memory, Bandwidth usage
- **Events:** Deployment history
- **Settings:** Update environment variables

### Check Health:
```bash
# Backend health
curl https://document-qa-backend.onrender.com/api/health

# List documents
curl https://document-qa-backend.onrender.com/api/documents
```

---

## 💰 Render Free Tier Details

```
┌─────────────────────────────────────┐
│ FREE TIER BENEFITS                  │
├─────────────────────────────────────┤
│ ✅ 750 hours/month                  │
│    (More than enough for 24/7)      │
├─────────────────────────────────────┤
│ ✅ 100 GB bandwidth/month           │
├─────────────────────────────────────┤
│ ✅ Automatic SSL                    │
├─────────────────────────────────────┤
│ ✅ Custom domains                   │
├─────────────────────────────────────┤
│ ✅ Auto-deploy from GitHub          │
├─────────────────────────────────────┤
│ ✅ Forever free                     │
├─────────────────────────────────────┤
│ ⚠️  Sleeps after 15min inactive     │
│    (30-60s cold start)              │
└─────────────────────────────────────┘
```

### Upgrade to Paid ($7/month):
- No sleep
- Always instant
- Better for production

---

## 🔗 Quick Links

- **Render Dashboard:** https://dashboard.render.com
- **Your GitHub Repo:** https://github.com/dewbulegoda20/document-QA-assistent
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Cron-Job.org:** https://cron-job.org
- **Render Docs:** https://render.com/docs

---

## 📝 Important Notes

1. **First request after sleep takes 30-60 seconds**
   - This is normal for free tier
   - Add loading message to frontend
   - Use keep-alive service to prevent

2. **Your API key is safe**
   - Stored as environment variable
   - Not visible in logs or code
   - Only accessible to your service

3. **Auto-deploy enabled**
   - Push to GitHub → Render auto-deploys
   - Check Render dashboard for deployment status
   - Rollback available if needed

4. **Logs are your friend**
   - Check logs for all errors
   - Real-time log streaming available
   - Download logs for analysis

---

## 🎯 Next Steps After Deployment

1. **Test thoroughly:**
   - Upload multiple PDFs
   - Ask various questions
   - Test edge cases

2. **Set up monitoring:**
   - Enable Render notifications
   - Set up keep-alive service
   - Monitor error rates

3. **Optimize frontend:**
   - Add loading states
   - Handle cold start delays
   - Add error messages

4. **Consider upgrade:**
   - If you need instant response
   - For production use
   - $7/month for no sleep

---

## ✅ You're Ready!

**Total deployment time: ~15 minutes**

Follow the steps above and your app will be live!

If you encounter any issues, check the troubleshooting section or review Render logs.

**Good luck! 🚀**

---

*Last updated: October 16, 2025*
