import multer from "multer";
import path from "path";
import fs from "fs";
import { ApiError } from "../helpers/ApiError.js";

const uploadDir = "./public/documents";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

//storage

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.filename + "-" + uniqueSuffix + ext);
  },
});

//file filter for Documents

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(
      new ApiError(
        400,
        "Image File Are not allowed,Please upload document file Only"
      ),
      false
    );
    return;
  }

  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
    "text/plain",
    "application/rtf",
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/json",
    "text/csv",
    "text/html",
    "application/xml",
    "text/xml",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Unsupported file type: ${file.mimetype}. Please upload a valid document file.`
      ),
      false
    );
  }
};

//allowed types for files

const fileUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, //10MB
  },
  fileFilter: fileFilter,
});

export default fileUpload;
