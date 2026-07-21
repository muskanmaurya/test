import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res) => res.status(200).send("Utils Service Live on Vercel"));

app.post("/api/upload", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: "Base64 image string is required" });
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: "vercel_mini_test",
    });

    return res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error: any) {
    console.error("Cloudinary Error:", error);
    return res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

export default app;