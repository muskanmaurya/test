import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import multer from "multer";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/test";

// 1. DB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log("Rider DB Connected"))
  .catch((err) => console.error("DB Error:", err));

const RiderSchema = new mongoose.Schema({
  riderName: String,
  profilePicUrl: String,
  createdAt: { type: Date, default: Date.now },
});

const Rider = mongoose.model("Rider", RiderSchema);

// 2. Multer Configuration
const upload = multer({ storage: multer.memoryStorage() });

// 3. Rider Photo Route
app.post("/api/rider/new", upload.single("file"), async (req, res) => {
  try {
    const { riderName } = req.body;
    const file = req.file;

    if (!riderName || !file) {
      return res.status(400).json({ message: "Rider name and photo are required" });
    }

    // Convert buffer to Base64 string
    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    // Call Utils Service
    const { data: uploadResult } = await axios.post(
      `${process.env.UTILS_SERVICE_URL}/api/upload`,
      { image: base64Image }
    );

    // Save to Database
    const newRider = await Rider.create({
      riderName,
      profilePicUrl: uploadResult.url,
    });

    return res.status(201).json({
      message: "Rider profile created successfully!",
      rider: newRider,
    });
  } catch (error: any) {
    console.error("Rider Error:", error.response?.data || error.message);
    return res.status(500).json({
      message: "Rider creation failed",
      error: error.response?.data || error.message,
    });
  }
});

export default app;