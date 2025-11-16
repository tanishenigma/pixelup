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

### Frontend
```bash
npm install
npm run dev
```

### Backend (Local)
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Backend (Docker)
```bash
./test-backend-local.sh
```

## 📁 Project Structure

```
├── src/                    # React frontend
│   ├── components/        # UI components
│   ├── pages/            # Page components
│   ├── services/         # API services
│   └── lib/              # Firebase config
├── backend/               # Flask backend
│   ├── app.py           # Main API
│   ├── Dockerfile       # Container config
│   └── requirements.txt # Python deps
├── model/                # RealESRGAN model files
├── firestore.rules       # Firestore security
├── storage.rules         # Storage security
└── firebase.json         # Firebase config
```

## 🔧 Configuration

### Environment Variables
Create `.env` in the project root:
```bash
VITE_BACKEND_URL=http://localhost:5000  # or your Cloud Run URL
```

### Firebase
Configuration is in `src/lib/firebase.ts` (already set up for project `twitter-clone-f1d5b`)

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Fast deployment guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Comprehensive deployment docs
- **[DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)** - Current deployment status
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Firebase configuration
- **[SETUP_REALESRGAN.md](./SETUP_REALESRGAN.md)** - RealESRGAN setup guide

## 🔐 Security

- Firestore rules enforce user-based access control
- Storage rules allow authenticated reads and owner writes
- CORS configured for secure cross-origin requests

## 🎯 Image Processing

The backend tries these methods in order:
1. **RealESRGAN Vulkan** (if binary available with GPU)
2. **OpenCV CPU Fallback** (4x bicubic + sharpening)

For GPU acceleration, deploy to a VM with Vulkan drivers (see `DEPLOYMENT.md`).

## 🐛 Troubleshooting

### CORS Errors
```bash
./deploy-cors.sh
```

### "Requires Index" Error
Wait for Firestore index to build (2-10 min). Check: [Firebase Console](https://console.firebase.google.com/project/twitter-clone-f1d5b/firestore/indexes)

### Backend Connection Issues
- Verify `VITE_BACKEND_URL` in `.env`
- Check Cloud Run logs in GCP Console
- Test health endpoint: `curl https://your-backend-url/health`

## 📊 Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Firebase Web SDK

### Backend
- Python 3.11
- Flask + CORS
- OpenCV
- NumPy
- Gunicorn

### Infrastructure
- Firebase Hosting
- Firebase Auth
- Cloud Firestore
- Firebase Storage
- Cloud Run (backend)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🔗 Links

- **Live App**: https://twitter-clone-f1d5b.web.app
- **Firebase Console**: https://console.firebase.google.com/project/twitter-clone-f1d5b
- **Cloud Console**: https://console.cloud.google.com/home/dashboard?project=twitter-clone-f1d5b

## 🎉 Credits

- RealESRGAN model by Tencent ARC Lab
- UI components from shadcn/ui
- Firebase by Google

---

**Ready to deploy?** Start with [QUICK_START.md](./QUICK_START.md) 🚀
