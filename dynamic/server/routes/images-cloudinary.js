import express from 'express';
import Image from '../models/Image.js';
import Mission from '../models/Mission.js';
import { ensureAuth } from '../middleware/auth.js';
import { upload, deleteFromCloudinary, getThumbnailUrl } from '../config/cloudinary.js';

const router = express.Router();

// Upload images to mission using Cloudinary
router.post('/upload/:missionId', ensureAuth, upload.array('images', 50), async (req, res) => {
  try {
    const mission = await Mission.findOne({ _id: req.params.missionId, userId: req.user._id });
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const images = [];
    for (const file of req.files) {
      const image = await Image.create({
        missionId: mission._id,
        userId: req.user._id,
        filename: file.filename,
        originalName: file.originalname,
        cloudinaryId: file.filename,
        url: file.path, // Cloudinary URL
        thumbnailUrl: getThumbnailUrl(file.filename),
        size: file.size,
        mimeType: file.mimetype,
        width: file.width,
        height: file.height,
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

    // Delete from Cloudinary
    if (image.cloudinaryId) {
      await deleteFromCloudinary(image.cloudinaryId);
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
