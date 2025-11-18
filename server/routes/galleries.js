import express from 'express';
import Gallery from '../models/Gallery.js';
import Mission from '../models/Mission.js';
import Image from '../models/Image.js';
import { ensureAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all galleries for user
router.get('/', ensureAuth, async (req, res) => {
  try {
    const galleries = await Gallery.find({ userId: req.user._id })
      .populate('missionId')
      .sort({ createdAt: -1 });
    res.json(galleries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get public gallery by slug (no auth required)
router.get('/public/:slug', async (req, res) => {
  try {
    const gallery = await Gallery.findOne({ slug: req.params.slug, isPublic: true })
      .populate('missionId')
      .populate('images.imageId');
    
    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found' });
    }

    // Filter to only include public images
    const publicImages = await Image.find({
      _id: { $in: gallery.images.map(img => img.imageId) },
      isPublic: true,
    });

    const filteredGallery = {
      ...gallery.toObject(),
      images: gallery.images.filter(img => 
        publicImages.some(pubImg => pubImg._id.toString() === img.imageId._id.toString())
      ),
    };

    res.json(filteredGallery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single gallery
router.get('/:id', ensureAuth, async (req, res) => {
  try {
    const gallery = await Gallery.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('missionId')
      .populate('images.imageId');
    
    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found' });
    }
    res.json(gallery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create gallery from mission
router.post('/', ensureAuth, async (req, res) => {
  try {
    const { missionId, title, description, isPublic, imageIds, layout, layoutConfig } = req.body;

    const mission = await Mission.findOne({ _id: missionId, userId: req.user._id });
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const gallery = await Gallery.create({
      missionId,
      userId: req.user._id,
      title,
      description,
      isPublic,
      layout: layout || mission.layout,
      layoutConfig: layoutConfig || mission.layoutConfig,
      images: imageIds ? imageIds.map((id, index) => ({
        imageId: id,
        order: index,
        layoutType: 'single',
      })) : [],
    });

    res.status(201).json(gallery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update gallery
router.put('/:id', ensureAuth, async (req, res) => {
  try {
    const gallery = await Gallery.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    ).populate('images.imageId');

    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found' });
    }
    res.json(gallery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete gallery
router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    const gallery = await Gallery.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found' });
    }
    res.json({ message: 'Gallery deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add images to gallery
router.post('/:id/images', ensureAuth, async (req, res) => {
  try {
    const { imageIds, layoutType } = req.body;
    
    const gallery = await Gallery.findOne({ _id: req.params.id, userId: req.user._id });
    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found' });
    }

    const newImages = imageIds.map((id, index) => ({
      imageId: id,
      order: gallery.images.length + index,
      layoutType: layoutType || 'single',
    }));

    gallery.images.push(...newImages);
    await gallery.save();

    res.json(gallery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove image from gallery
router.delete('/:id/images/:imageId', ensureAuth, async (req, res) => {
  try {
    const gallery = await Gallery.findOne({ _id: req.params.id, userId: req.user._id });
    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found' });
    }

    gallery.images = gallery.images.filter(
      img => img.imageId.toString() !== req.params.imageId
    );
    await gallery.save();

    res.json(gallery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
