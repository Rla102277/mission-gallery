import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import Image from '../models/Image.js';
import Mission from '../models/Mission.js';
import { ensureAuth } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', req.user._id.toString());
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

// Upload images to mission
router.post('/upload/:missionId', ensureAuth, upload.array('images', 50), async (req, res) => {
  try {
    const mission = await Mission.findOne({ _id: req.params.missionId, userId: req.user._id });
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const images = [];
    for (const file of req.files) {
      // Generate thumbnail
      const thumbnailPath = file.path.replace(path.extname(file.path), '_thumb.jpg');
      await sharp(file.path)
        .resize(400, 400, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      // Get image metadata
      const metadata = await sharp(file.path).metadata();

      const image = await Image.create({
        missionId: mission._id,
        userId: req.user._id,
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        thumbnailPath,
        size: file.size,
        mimeType: file.mimetype,
        width: metadata.width,
        height: metadata.height,
      });

      images.push(image);
    }

    res.status(201).json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get images for mission
router.get('/mission/:missionId', ensureAuth, async (req, res) => {
  try {
    const mission = await Mission.findOne({ _id: req.params.missionId, userId: req.user._id });
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const images = await Image.find({ missionId: mission._id }).sort({ order: 1, uploadedAt: 1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update image
router.put('/:id', ensureAuth, async (req, res) => {
  try {
    const image = await Image.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete image
router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    const image = await Image.findOne({ _id: req.params.id, userId: req.user._id });
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete files
    try {
      await fs.unlink(image.path);
      if (image.thumbnailPath) {
        await fs.unlink(image.thumbnailPath);
      }
    } catch (err) {
      console.error('Error deleting files:', err);
    }

    await image.deleteOne();
    res.json({ message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk update image order
router.post('/reorder', ensureAuth, async (req, res) => {
  try {
    const { imageOrders } = req.body; // Array of { id, order }
    
    const updatePromises = imageOrders.map(({ id, order }) =>
      Image.findOneAndUpdate(
        { _id: id, userId: req.user._id },
        { order },
        { new: true }
      )
    );

    await Promise.all(updatePromises);
    res.json({ message: 'Images reordered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
