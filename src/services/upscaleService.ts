import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

export interface UpscaleResponse {
  newUrl: string;
  upscaledUrl?: string;
}

export const upscaleService = {
  /**
   * Upscale an image using the Cloud Function
   * @param filePath - The Firebase Storage path of the image (e.g., "raw-uploads/image.jpg")
   * @param method - The upscaling method: 'custom' uses local Real-ESRGAN, 'gemini' uses Gemini AI
   * @param modelName - The name of the Real-ESRGAN model to use (optional)
   * @param customModelFile - Custom model file to upload (optional)
   * @param geminiApiKey - Gemini API key for Gemini mode (optional)
   */
  async upscaleImage(
    filePath: string,
    method: "gemini" | "custom",
    modelName?: string,
    customModelFile?: File | null,
    geminiApiKey?: string
  ): Promise<UpscaleResponse> {
    try {
      console.log(`🚀 Calling Cloud Function with method: ${method}`);
      console.log(`📁 File path: ${filePath}`);
      if (geminiApiKey) {
        console.log(`🔑 Using provided API key`);
      }
      if (customModelFile) {
        console.log(`📦 Custom model: ${customModelFile.name}`);
      }

      // Use Firebase callable function
      const upscaleImageFn = httpsCallable(functions, "upscaleImage");

      const result = await upscaleImageFn({
        filePath,
        imageUrl: filePath, // Send both for compatibility
        method,
        geminiApiKey,
        modelName,
      });

      const data = result.data as any;

      console.log(`✅ Upscaling successful!`);
      console.log(`📸 New URL: ${data.upscaledUrl || data.newUrl}`);

      return {
        newUrl: data.upscaledUrl || data.newUrl,
        upscaledUrl: data.upscaledUrl,
      };
    } catch (error: any) {
      console.error("❌ Upscaling failed:", error);

      let errorMessage = "Failed to upscale image";

      if (error.code === "functions/unavailable") {
        errorMessage =
          "⚠️ Upscaling service is not available.\n\n" +
          "The Python service on port 5000 is not running.\n\n" +
          "To start it:\n" +
          "1. Open a new terminal\n" +
          "2. Navigate to your Python service directory\n" +
          "3. Run: python app.py (or python server.py)\n" +
          "4. Make sure it's running on port 5000";
      } else if (error.code === "functions/unauthenticated") {
        errorMessage = "Please sign in to upscale images.";
      } else if (error.code === "functions/invalid-argument") {
        errorMessage = error.message || "Invalid request parameters.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Check if the upscale service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Just check if the function exists
      return true;
    } catch {
      return false;
    }
  },
};
