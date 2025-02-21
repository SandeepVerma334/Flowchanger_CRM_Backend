import { console } from "inspector";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg", "image/png", "image/jpg", "image/webp", "image/svg+xml",
    "image/gif", "image/pdf", "image/psd", "image/svg", "image/tiff",
    "image/mp4", "image/avi", "application/pdf", "video/mp4", "video/webm",
    "video/ogg", "video/3gp", "video/mov", "video/flv", "video/avi",
    "video/mpeg", "video/quicktime", "text/plain",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file format!"), false);
  }
};

// Function to create Multer instance
const upload = () =>
  multer({
    storage: memoryStorage,
    limits: { fileSize: 1024 * 1024 * 50 }, // Limit file size to 50MB
    fileFilter,
  });

// Middleware to handle Cloudinary upload for single file
const uploadAndSaveToCloudinary = (fieldName) => (req, res, next) => {
  upload().single(fieldName)(req, res, async (err) => {
    if (err) {
      return res.status(400).send(err.message);
    }

    let folderName = determineFolderName(req.route.path);

    if (req.file) {
      try {
        const cloudinaryResult = await cloudinary.v2.uploader.upload(
          `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
          {
            folder: folderName,
            public_id: `${Date.now()}-${uuidv4()}`,
          }
        );

        req.imageUrl = cloudinaryResult.secure_url;
      } catch (uploadError) {
        return res
          .status(500)
          .json({ error: "Cloudinary upload failed", details: uploadError });
      }
    }

    next();
  });
};

// Middleware to handle Cloudinary upload for multiple files
const uploadMultipleAndSaveToCloudinary = (fieldName) => (req, res, next) => {
  upload().array(fieldName)(req, res, async (err) => {
    if (err) {
      return res.status(400).send(err.message);
    }
    let folderName = determineFolderName(req.route.path);
    req.uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const fileType = file.mimetype.split("/")[0]; // Extract the type (e.g., image, video)
          const resourceType = fileType === "video" ? "video" : "image"; // Determine resource type
          const cloudinaryResult = await cloudinary.v2.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            {
              folder: folderName,
              resource_type: resourceType,
              public_id: `${Date.now()}-${uuidv4()}`,
            }
          );
          req.uploadedFiles.push({
            originalName: file.originalname,
            multiImageUrl: cloudinaryResult.secure_url,
          });
        }
      } catch (uploadError) {
        return res
          .status(500)
          .json({ error: "Cloudinary upload failed", details: uploadError });
      }
    }
    next();
  });
};

// Helper function to determine folder name based on route
const determineFolderName = (routePath) => {
  if (routePath.includes("in")) return "Punch_In_Images";
  if (routePath.includes("start")) return "Start_Break_Images";
  if (routePath.includes("end")) return "End_Break_Images";
  if (routePath.includes("out")) return "Punch_Out_Images";
  if (routePath.includes("verify")) return "Background_Verification_Images";
  if (routePath.includes("project-files")) return "Project_File_Images";
  if (routePath.includes("work-entry")) return "Work_Entry_Images";
  return "Default_Folder";
};

export { uploadAndSaveToCloudinary, uploadMultipleAndSaveToCloudinary };