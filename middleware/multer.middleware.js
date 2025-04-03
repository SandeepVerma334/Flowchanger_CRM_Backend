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
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

const handleUpload = (req, res, next) => {
  return (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    next();
  };
};

const uploadSingle = (field) => (req, res, next) => {
  upload.single(field)(req, res, (err) => handleUpload(req, res, next)(err));
};

const uploadMultipleFields = (fields) => (req, res, next) => {
  upload.fields(fields)(req, res, (err) => handleUpload(req, res, next)(err));
};

const uploadMultipleInSingleField = (field) => (req, res, next) => {
  upload.array(field)(req, res, (err) => handleUpload(req, res, next)(err));
};

export { uploadSingle, uploadMultipleFields, uploadMultipleInSingleField };
