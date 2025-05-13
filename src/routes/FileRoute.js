// src/routes/FileRoute.js
import express from "express";
import { authMiddleware } from "../middleware/AuthMiddleware.js";
import fileUpload from "../middleware/File_Multer_Middleware.js";
import {
  uploadFile,
  getUserFiles,
  getFileById,
  downloadFile,
  deleteFile,
  getFileStats,
} from "../controller/FileController.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/files/upload/multiple:
 *   post:
 *     summary: Upload multiple files (max 5 total per user)
 *     tags: [Files]
 *     security:
 *       - BearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: files
 *         type: array
 *         items:
 *           type: file
 *         required: true
 *         description: Files to upload (only document files, no images)
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *       400:
 *         description: Invalid request, file type, or maximum number of files reached
 *       401:
 *         description: Unauthorized
 */
router.post("/upload", authMiddleware, fileUpload.array("files"), uploadFile);

/**
 * @swagger
 * /api/v1/files:
 *   get:
 *     summary: Get all files for the authenticated user
 *     tags: [Files]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for file name
 *       - in: query
 *         name: fileType
 *         schema:
 *           type: string
 *         description: Filter by file type/extension (e.g., pdf, docx)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, size, originalName]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order (ascending or descending)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of files
 *       401:
 *         description: Unauthorized
 */
router.get("/", authMiddleware, getUserFiles);

/**
 * @swagger
 * /api/v1/files/stats:
 *   get:
 *     summary: Get file statistics for the authenticated user
 *     tags: [Files]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: File statistics
 *       401:
 *         description: Unauthorized
 */
router.get("/stats", authMiddleware, getFileStats);

/**
 * @swagger
 * /api/v1/files/{id}:
 *   get:
 *     summary: Get file details by ID
 *     tags: [Files]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File details
 *       404:
 *         description: File not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", authMiddleware, getFileById);

/**
 * @swagger
 * /api/v1/files/{id}/download:
 *   get:
 *     summary: Download a file
 *     tags: [Files]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File stream
 *       404:
 *         description: File not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id/download", authMiddleware, downloadFile);

/**
 * @swagger
 * /api/v1/files/{id}:
 *   delete:
 *     summary: Delete a file
 *     tags: [Files]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", authMiddleware, deleteFile);

export default router;
