import { ApiError } from "../helpers/ApiError.js";
import { asyncHandler } from "../helpers/asyncHandler.js";
import File from "../models/FileModelSchema.js";
export const uploadFile = asyncHandler(async (req, res, next) => {
  if (!req.files) {
    throw new ApiError(400, "no file uploaded");
  }

  // console.log(req.user);
  const userId = req.user.sub;
  console.log(userId);

  if (req.files) {
    const savedFiles = [];
    console.log(req.files);
    for (const file of req.files) {
      const newFile = new File({
        user: userId,
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
      });

      const savedFile = await newFile.save();
      savedFiles.push({
        fileId: savedFile._id,
        filename: savedFile.originalName,
        mimetype: savedFile.mimetype,
        size: savedFile.size,
      });
    }

    return res.status(201).json({
      success: true,
      message: `${savedFiles.length} files Uploaded SuccessFully`,
      data: savedFiles,
    });
  }
});
export const getUserFiles = asyncHandler(async (req, res, next) => {});
export const getFileById = asyncHandler(async (req, res, next) => {});
export const deleteFile = asyncHandler(async (req, res, next) => {});
export const getFileStats = asyncHandler(async (req, res, next) => {});
export const downloadFile = asyncHandler(async (req, res, file) => {});
