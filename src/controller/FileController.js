import { asyncHandler } from "../helpers/asyncHandler.js";
import { ApiError } from "../helpers/ApiError.js";
import User from "../models/UserModel.js";
import File from "../models/FileModel.js"; // We'll create this model
import fs from "fs";
import path from "path";

// Maximum file upload limits
const MAX_FILES = 10; // Maximum number of files a user can upload
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const TOTAL_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB total upload size

export const uploadFiles = asyncHandler(async (req, res, next) => {
  // Ensure user is authenticated
  const userId = req.user?.sub;
  if (!userId) {
    return next(new ApiError(401, "Unauthorized: No user found"));
  }

  // Check if files were uploaded
  if (!req.files || req.files.length === 0) {
    return next(new ApiError(400, "No files uploaded"));
  }

  // Validate number of files
  if (req.files.length > MAX_FILES) {
    // Clean up uploaded files
    req.files.forEach((file) => {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error(`Error deleting file ${file.path}:`, err);
      }
    });
    return next(new ApiError(400, `Maximum ${MAX_FILES} files allowed`));
  }

  // Calculate total file size
  const totalFileSize = req.files.reduce((total, file) => total + file.size, 0);
  if (totalFileSize > TOTAL_MAX_FILE_SIZE) {
    // Clean up uploaded files
    req.files.forEach((file) => {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error(`Error deleting file ${file.path}:`, err);
      }
    });
    return next(
      new ApiError(
        400,
        `Total file size cannot exceed ${TOTAL_MAX_FILE_SIZE / (1024 * 1024)}MB`
      )
    );
  }

  try {
    // Create file records in database
    const fileRecords = await Promise.all(
      req.files.map(async (file) => {
        return await File.create({
          user: userId,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path.replace(/\\/g, "/"), // Normalize path
        });
      })
    );

    res.status(201).json({
      success: true,
      message: "Files uploaded successfully",
      data: fileRecords.map((file) => ({
        id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        mimetype: file.mimetype,
        size: file.size,
      })),
    });
  } catch (error) {
    // Clean up uploaded files in case of database error
    req.files.forEach((file) => {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error(`Error deleting file ${file.path}:`, err);
      }
    });
    return next(new ApiError(500, "Error processing file upload"));
  }
});

export const getUserFiles = asyncHandler(async (req, res, next) => {
  const userId = req.user?.sub;
  if (!userId) {
    return next(new ApiError(401, "Unauthorized: No user found"));
  }

  // Optional pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Find files for the user with pagination
    const files = await File.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-path"); // Exclude full path for security

    const total = await File.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      message: "User files retrieved successfully",
      data: {
        files: files.map((file) => ({
          id: file._id,
          filename: file.filename,
          originalName: file.originalName,
          mimetype: file.mimetype,
          size: file.size,
          createdAt: file.createdAt,
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalFiles: total,
        },
      },
    });
  } catch (error) {
    return next(new ApiError(500, "Error retrieving user files"));
  }
});

export const deleteFile = asyncHandler(async (req, res, next) => {
  const userId = req.user?.sub;
  const fileId = req.params.fileId;

  if (!userId) {
    return next(new ApiError(401, "Unauthorized: No user found"));
  }

  try {
    // Find the file and ensure it belongs to the user
    const file = await File.findOneAndDelete({
      _id: fileId,
      user: userId,
    });

    if (!file) {
      return next(
        new ApiError(
          404,
          "File not found or you do not have permission to delete"
        )
      );
    }

    // Delete the physical file
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.error(`Error deleting file ${file.path}:`, err);
      // Not a critical error, file might already be deleted
    }

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
      data: {
        id: file._id,
        filename: file.filename,
      },
    });
  } catch (error) {
    return next(new ApiError(500, "Error deleting file"));
  }
});
