# 🚀 Quick Deployment Guide

## Current Status: ✅ Partially Deployed

### What's Already Deployed
- ✅ **Frontend**: https://twitter-clone-f1d5b.web.app
- ✅ **Firestore Rules & Indexes**: Deployed
- ✅ **Storage Rules**: Deployed
- ✅ **Docker Configuration**: Ready (`backend/Dockerfile`)

### What's Pending (Requires Your Local Machine)
- ⏳ **Backend Deployment** (requires gcloud CLI)
- ⏳ **Storage CORS** (requires gsutil)
- ⏳ **Frontend Update** (after backend is deployed)

---

## 📋 Complete These Steps on Your Local Machine

### Prerequisites
Install these tools:
```bash
# Google Cloud SDK (includes gcloud & gsutil)
# https://cloud.google.com/sdk/docs/install

# Docker
# https://docs.docker.com/get-docker/

# Firebase CLI (already installed in this environment)
npm install -g firebase-tools
```

### Step 1: Test Backend Locally (Optional)
```bash
# Build and run backend in Docker locally
./test-backend-local.sh

# This will:
# - Build Docker image
# - Start container on port 5000
# - Test health endpoint
```

### Step 2: Deploy Backend to Cloud Run
```bash
# Deploy using the prepared script
./deploy-backend.sh

# This will:
# 1. Build Docker image
# 2. Push to Google Container Registry
# 3. Deploy to Cloud Run
# 4. Give you a service URL
```

**Expected Output**: `Service URL: https://pixelup-backend-xxxxx-uc.a.run.app`

### Step 3: Update Frontend with Backend URL
```bash
# Update .env with your Cloud Run URL
echo "VITE_BACKEND_URL=https://YOUR-CLOUD-RUN-URL.run.app" > .env

# Rebuild and redeploy
npm run build
firebase deploy --only hosting
```

### Step 4: Apply Storage CORS
```bash
# Apply CORS configuration
./deploy-cors.sh

# Or manually:
gsutil cors set storage.cors.json gs://twitter-clone-f1d5b.appspot.com
```

---

## 🧪 Verify Everything Works

### 1. Backend Health
```bash
curl https://YOUR-BACKEND-URL.run.app/health
# Expected: {"status": "healthy"}
```

### 2. Process Test
```bash
curl -F "file=@./some-image.jpg" https://YOUR-BACKEND-URL.run.app/process
# Expected: JSON with base64 image data
```

### 3. Frontend Test
1. Visit: https://twitter-clone-f1d5b.web.app
2. Sign in
3. Upload image
4. Process with RealESRGAN
5. View in My Images
6. Download and delete

---

## 📁 Deployment Scripts

| Script | Purpose |
|--------|---------|
| `test-backend-local.sh` | Test backend in Docker locally (port 5000) |
| `deploy-backend.sh` | Deploy backend to Cloud Run |
| `deploy-cors.sh` | Apply CORS to Storage bucket |

---

## ⚠️ Important Notes

### GPU Support
- **Cloud Run**: CPU only (uses OpenCV fallback)
- **For GPU**: Deploy to Compute Engine VM (see `DEPLOYMENT.md`)

### Model Files
- Current: `model/RealESRGAN_General_x4_v3.param` ✅
- Missing: `.bin` weights file
- Add `.bin` file to `model/` folder for full RealESRGAN support

### Firestore Index
The composite index may take 2-10 minutes to build after deployment. Check status at:
https://console.firebase.google.com/project/twitter-clone-f1d5b/firestore/indexes

---

## 📚 Documentation

- **Full Guide**: `DEPLOYMENT.md`
- **Status**: `DEPLOYMENT_STATUS.md`
- **Migration**: `MIGRATION_SUMMARY.md`
- **Firebase Setup**: `FIREBASE_SETUP.md`
- **RealESRGAN Setup**: `SETUP_REALESRGAN.md`

---

## 🆘 Troubleshooting

### CORS Errors
Run: `./deploy-cors.sh` or configure via Cloud Console

### "Requires Index" Error
Wait for index to build (check Firebase Console)

### Backend Not Responding
Check Cloud Run logs in GCP Console

### Frontend Can't Connect
Verify `VITE_BACKEND_URL` in `.env` and rebuild

---

## 🎯 Current Next Action

**Run this on your local machine:**
```bash
./deploy-backend.sh
```

Then update frontend and apply CORS as described above.
