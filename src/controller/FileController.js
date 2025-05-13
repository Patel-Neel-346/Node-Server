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
export const getUserFiles = asyncHandler(async (req, res, next) => {
  const userId = req.user.sub;

  const {
    search = "",
    fileType = "",
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    limit = 10,
  } = req.query;

  // Build filter conditions
  const filter = { user: userId };

  if (search) {
    filter.originalName = { $regex: search, $options: "i" };
  }

  if (fileType) {
    filter.mimetype = { $regex: fileType, $options: "i" };
  }

  // Build sort options
  const sortOptions = {};
  const allowedSortFields = ["createdAt", "size", "originalName"];

  if (allowedSortFields.includes(sortBy)) {
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
  } else {
    sortOptions.createdAt = -1;
  }
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const files = await File.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit))
    .select("-path -__v");

  const total = await File.countDocuments(filter);

  return res.status(200).json({
    success: true,
    message: "Files retrieved successfully",
    data: {
      files,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

export const getFileById = asyncHandler(async (req, res, next) => {
  const fileId = req.params.id;
  const userId = req.user.sub;

  const file = await File.findOne({ _id: fileId, user: userId })
    .select("-path -__v")
    .populate("user");

  if (!file) {
    throw new ApiError(404, "file not Found!!!");
  }
  return res.status(200).json({
    success: true,
    message: "File details retrieved successfully",
    data: file,
  });
});

export const getFileStats = asyncHandler(async (req, res, next) => {
  const userId = req.user.sub;
  const totalFiles = await File.countDocuments({ user: userId });

  const fileSizeResult = await File.aggregate([
    {
      $match: {
        user: userId,
      },
    },

    {
      $group: {
        _id: null,
        totalSize: {
          $sum: "$size",
        },
      },
    },
  ]);
  console.log(fileSizeResult);
  const totalSize = fileSizeResult.length > 0 ? fileSizeResult[0].totalSize : 0;
  console.log(totalSize);
  const FileTypeStates = await File.aggregate([
    {
      $match: {
        user: userId,
      },
    },

    {
      $group: {
        _id: "$mimetype",
        count: { $sum: 1 },
        totalSize: { $sum: "$size" },
      },
    },

    {
      $sort: {
        count: -1,
      },
    },
  ]);
  console.log(FileTypeStates);

  //format file types for easier reading
  const fileTypes = FileTypeStates.map((stat) => {
    const type = stat._id.split("/").pop();
    return {
      type,
      mimetype: stat._id,
      count: stat.count,
      totalSize: stat.totalSize,
    };
  });

  return res.status(200).json({
    success: true,
    message: "File Statistics retrived SuccessFully",
    data: {
      totalFiles,
      totalSize,
      sizeInMB: (totalSize / (1024 * 1024)).toFixed(2),
      fileTypes,
    },
  });
});
export const downloadFile = asyncHandler(async (req, res, file) => {});

export const deleteFile = asyncHandler(async (req, res, next) => {});
