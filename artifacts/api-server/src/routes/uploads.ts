import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { UploadFileResponse } from "@workspace/api-zod";
import { db, uploadedFilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error("Only images and PDFs are allowed"));
    }
  },
});

const router: IRouter = Router();

router.post("/uploads", upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${unique}${path.extname(req.file.originalname)}`;
  const base64Data = req.file.buffer.toString("base64");
  const mimeType = req.file.mimetype || "application/octet-stream";

  try {
    // Save to PostgreSQL database for 100% persistence across restarts
    await db.insert(uploadedFilesTable).values({
      filename,
      mimeType,
      data: base64Data,
    });

    // Also write to local cache if possible
    try {
      fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
    } catch {
      // Ignore local disk cache errors
    }

    const fileUrl = `/api/uploads/${filename}`;
    res.json(UploadFileResponse.parse({ url: fileUrl, filename }));
  } catch (err) {
    console.error("Error saving uploaded file:", err);
    res.status(500).json({ error: "Failed to save uploaded file" });
  }
});

router.get("/uploads/:filename", async (req: Request, res: Response): Promise<void> => {
  const raw = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
  const safeFilename = path.basename(raw);

  try {
    // 1. First check PostgreSQL database
    const [file] = await db
      .select()
      .from(uploadedFilesTable)
      .where(eq(uploadedFilesTable.filename, safeFilename));

    if (file) {
      const buffer = Buffer.from(file.data, "base64");
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.send(buffer);
      return;
    }

    // 2. Fallback to local disk if exists
    const filePath = path.join(uploadDir, safeFilename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
      return;
    }

    res.status(404).json({ error: "File not found" });
  } catch (err) {
    console.error("Error retrieving file:", err);
    res.status(500).json({ error: "Failed to retrieve file" });
  }
});

export default router;
