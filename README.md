# PixelUp - AI Image Enhancement Platform

Transform your images with RealESRGAN-powered AI enhancement. Upload, process, and download high-quality upscaled images instantly.

## 🌐 Live Demo

**Frontend**: https://twitter-clone-f1d5b.web.app

## ✨ Features

- 🎨 **AI Image Enhancement**: Local RealESRGAN processing with OpenCV fallback
- 🔐 **Secure Authentication**: Firebase Auth integration
- ☁️ **Cloud Storage**: Original and enhanced images stored in Firebase Storage
- 📊 **Image Gallery**: View, download, and manage your processed images
- 🗑️ **Full Management**: Delete images and metadata with one click
- 🚀 **Modern Stack**: React + TypeScript + Vite frontend, Flask backend

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓ REST API
Backend (Flask + OpenCV/RealESRGAN)
    ↓ Firebase SDK
Storage (Original & Enhanced Images)
    ↓ Metadata
Firestore (upscaledImages collection)
```

## 🚀 Quick Deployment

### Already Deployed ✅
- Frontend on Firebase Hosting
- Firestore & Storage rules
- Security configurations

### Deploy Backend (Your Local Machine)
```bash
# 1. Test locally with Docker
./test-backend-local.sh

# 2. Deploy to Cloud Run
./deploy-backend.sh

# 3. Update frontend
echo "VITE_BACKEND_URL=<your-cloud-run-url>" > .env
npm run build
firebase deploy --only hosting

# 4. Apply Storage CORS
./deploy-cors.sh
```

See **[QUICK_START.md](./QUICK_START.md)** for detailed instructions.

## 📋 Prerequisites

- Node.js 18+
- Docker
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud SDK (for backend deployment)

## 🛠️ Development
# PixelUp (Local Only Edition)

This repository has been stripped of all Docker and Cloud/CI deployment artifacts per request. What remains is the minimal code needed to run the image enhancement app entirely on your local machine.

## Features
- Local RealESRGAN (if Vulkan binary present) with OpenCV fallback
- Firebase Auth, Firestore metadata, and Storage for images
- React + TypeScript + Vite frontend
- FastAPI backend (no Docker)

## Run Locally
Frontend:
```bash
npm install
npm run dev
```
Backend:
```bash
python -m venv backend/.venv_local
backend/.venv_local/bin/pip install -r backend/requirements.txt
backend/.venv_local/bin/python backend/app.py
```
Env file (`.env`):
```bash
VITE_BACKEND_URL=http://localhost:5000
```

## Project Structure (Trimmed)
```
├── src/              # React app
├── backend/          # FastAPI server (app.py, requirements.txt)
├── model/            # RealESRGAN model params
├── firestore.rules   # Firestore security rules
├── storage.rules     # Storage security rules
└── firebase.json     # Firebase config (needed for local + hosted frontend)
```

## Image Processing Logic
1. Attempt RealESRGAN via `/usr/bin/realesrgan-ncnn-vulkan`
2. Fallback: 4× bicubic resize + sharpen (OpenCV)

## Tech Stack
Frontend: React, Vite, Tailwind, shadcn/ui, Firebase SDK
Backend: FastAPI, Uvicorn, OpenCV (headless), NumPy
Infra (remaining): Firebase Auth, Firestore, Storage

## Security
Rules in `firestore.rules` and `storage.rules` enforce per-user access. Keep them if you still use Firebase; remove if not needed.

## Credits
RealESRGAN (Tencent ARC Lab), shadcn/ui, Firebase.

## License
MIT

All deployment docs and scripts have been removed; this README is now the sole guide.
## 🔐 Security
