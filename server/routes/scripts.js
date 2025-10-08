import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadDir = "server/uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept text files, PDFs, and documents
    const allowedTypes = /txt|pdf|doc|docx|md/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only text files, PDFs, and documents are allowed!"));
    }
  },
});

// 📤 POST /api/scripts/upload - Upload a new script
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { title, description, userId } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;

    // Save script metadata to database
    const script = await prisma.script.create({
      data: {
        userId: userId || null,
        title: title || req.file.originalname,
        description: description || null,
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      },
    });

    res.json({
      success: true,
      script,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// 📋 GET /api/scripts - Get all scripts
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    const scripts = await prisma.script.findMany({
      where: userId ? { userId } : {},
      orderBy: { uploadedAt: "desc" },
    });

    res.json(scripts);
  } catch (err) {
    console.error("Error fetching scripts:", err);
    res.status(500).json({ error: "Failed to fetch scripts" });
  }
});

// 🗑️ DELETE /api/scripts/:id - Delete a script
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the script first to get file path
    const script = await prisma.script.findUnique({
      where: { id },
    });

    if (!script) {
      return res.status(404).json({ error: "Script not found" });
    }

    // Delete the file from filesystem
    const filePath = path.join(uploadDir, script.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.script.delete({
      where: { id },
    });

    res.json({ success: true, message: "Script deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete script" });
  }
});

export default router;

