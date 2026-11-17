# PixelUp (Local Only Edition)

Transform your images locally with RealESRGAN-powered AI enhancement (or Sharp 4x cubic + sharpen fallback). No accounts, authentication, or cloud services required.

## Features
- Local RealESRGAN processing (when `realesrgan-ncnn-vulkan` is installed) with Sharp 4x cubic + sharpen fallback
- Local disk storage (`backend/local_storage/`) for original and upscaled images
- React + TypeScript + Vite frontend
- Node.js + Express backend (no Python or Firebase required)

## Run Locally

### Development mode (backend + Vite dev server)
```bash
npm install
npm run dev
```
- Frontend: `http://localhost:8080`
- Backend: `http://127.0.0.1:5050`

### Production/single-server mode
```bash
npm run start
```
Builds the frontend into `dist/` and serves both the UI and API from `http://127.0.0.1:5050`.
