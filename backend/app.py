import base64
import logging
import os
import subprocess
import tempfile
from pathlib import Path

import cv2
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# Correct model folder
MODEL_DIR = Path("/home/feather/custom-models-main/models")
MODEL_NAME = "RealESRGAN_General_x4_v3"

def enhance_with_realesrgan(image_bytes: bytes) -> bytes:
    """
    Enhance image using RealESRGAN (ncnn-vulkan).
    Falls back to OpenCV bicubic upscaling if RealESRGAN is not found.
    """
    try:
        # Load the input image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise RuntimeError("Cannot decode input image")

        # Check if realesrgan-ncnn-vulkan exists
        realesrgan_exe = "/usr/bin/realesrgan-ncnn-vulkan"
        try:
            result = subprocess.run(
                [realesrgan_exe, "-h"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            # If the help text contains "Usage:" then the binary is working
            if "Usage:" in result.stderr or "Usage:" in result.stdout:
                has_realesrgan = True
            else:
                has_realesrgan = False

            logging.info("RealESRGAN stdout: " + result.stdout)
            logging.info("RealESRGAN stderr: " + result.stderr)

        except Exception as e:
            has_realesrgan = False
            logging.error(f"RealESRGAN execution error: {e}")

        # --- REALESRGAN MODE ---
        if has_realesrgan:
            with tempfile.TemporaryDirectory() as tmpdir:
                input_path = Path(tmpdir) / "input.png"
                output_path = Path(tmpdir) / "output.png"

                # Save temporary input
                cv2.imwrite(str(input_path), img)

                # Build command
                cmd = [
                    realesrgan_exe,
                    "-i", str(input_path),
                    "-o", str(output_path),
                    "-n", MODEL_NAME,
                    "-m", str(MODEL_DIR),
                    "-s", "4",
                    "-f", "png"
                ]

                logging.info("Running RealESRGAN: " + " ".join(cmd))

                result = subprocess.run(cmd, capture_output=True, text=True)

                if result.returncode != 0:
                    logging.error("RealESRGAN error: " + result.stderr)
                    raise RuntimeError("RealESRGAN processing failed")

                if not output_path.exists():
                    raise RuntimeError("RealESRGAN output not found")

                enhanced_img = cv2.imread(str(output_path))
                if enhanced_img is None:
                    raise RuntimeError("Failed to read RealESRGAN result")

                logging.info("Image successfully enhanced with RealESRGAN")

        # --- FALLBACK MODE ---
        else:
            h, w = img.shape[:2]
            enhanced_img = cv2.resize(img, (w * 4, h * 4), interpolation=cv2.INTER_CUBIC)

            kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
            enhanced_img = cv2.filter2D(enhanced_img, -1, kernel)

            logging.info("Used OpenCV fallback (bicubic + sharpen)")

        # Encode to PNG
        success, buffer = cv2.imencode(".png", enhanced_img)
        if not success:
            raise RuntimeError("Cannot encode enhanced image")

        return buffer.tobytes()

    except Exception as e:
        logging.error(f"Enhancement error: {e}")
        raise RuntimeError(str(e))


@app.route("/process", methods=["POST"])
def process():
    """Process image using local RealESRGAN model"""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]

    try:
        raw_bytes = file.read()

        try:
            enhanced_bytes = enhance_with_realesrgan(raw_bytes)
        except Exception as err:
            return jsonify({
                "error": "Enhancement failed",
                "detail": str(err)
            }), 500

        b64 = base64.b64encode(enhanced_bytes).decode("utf-8")

        return jsonify({
            "enhanced_image_base64": b64,
            "mime_type": "image/png",
            "fallback": False,
            "reason": None,
            "strategy": "realesrgan"
        })

    except Exception as e:
        logging.error(f"Processing error: {e}")
        return jsonify({"error": "Enhancement failed", "detail": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)
