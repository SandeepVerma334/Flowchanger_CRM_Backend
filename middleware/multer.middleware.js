import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Cloudinary Storage Setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "uploads", // Change folder name if needed
    format: async () => "png", // Change format if needed
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

// Initialize Multer
const upload = multer({ storage });

const uploadSingle = (field) => upload.single(`${field}`); // Single file upload
const uploadMultipleFields = (fields) => upload.fields(fields); // Multiple field uploads
const uploadMultipleInSingleField = (field) => upload.array(`${field}`); // Multiple files in a single field

export { uploadSingle, uploadMultipleFields, uploadMultipleInSingleField }
