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
  .then(() => console.log("Restaurant DB Connected"))
  .catch((err) => console.error("DB Error:", err));

const RestaurantSchema = new mongoose.Schema({
  name: String,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
});

const Restaurant = mongoose.model("Restaurant", RestaurantSchema);

// 2. Multer Configuration (Memory Storage for Serverless)
const upload = multer({ storage: multer.memoryStorage() });

// 3. Restaurant Creation Route
app.post("/api/restaurant/new", upload.single("file"), async (req, res) => {
  try {
    const { name } = req.body;
    const file = req.file;

    if (!name || !file) {
      return res.status(400).json({ message: "Name and image file are required" });
    }

    // Convert memory buffer to Base64 string
    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    // Call Utils Service
    const { data: uploadResult } = await axios.post(
      `${process.env.UTILS_SERVICE_URL}/api/upload`,
      { image: base64Image }
    );

    // Save to Database
    const newRestaurant = await Restaurant.create({
      name,
      imageUrl: uploadResult.url,
    });

    return res.status(201).json({
      message: "Restaurant created successfully!",
      restaurant: newRestaurant,
    });
  } catch (error: any) {
    console.error("Restaurant Error:", error.response?.data || error.message);
    return res.status(500).json({
      message: "Restaurant creation failed",
      error: error.response?.data || error.message,
    });
  }
});

export default app;