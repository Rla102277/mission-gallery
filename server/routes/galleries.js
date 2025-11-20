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

// Get all public galleries (no auth required)
router.get('/public/all', async (req, res) => {
  try {
    const galleries = await Gallery.find({ isPublic: true })
      .populate('missionId')
      .populate('images.imageId')
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
    const { missionId, title, description, isPublic, images, layout, layoutConfig, lightroomAlbum, enablePrints, printPricing, isPortfolio } = req.body;

    let mission = null;
    if (missionId) {
      mission = await Mission.findOne({ _id: missionId, userId: req.user._id });
      if (!mission) {
        return res.status(404).json({ error: 'Mission not found' });
      }
    }

    const gallery = await Gallery.create({
      missionId: missionId || null,
      userId: req.user._id,
      title,
      description,
      isPublic,
      isPortfolio: Boolean(isPortfolio),
      layout: layout || mission?.layout || 'grid',
      layoutConfig: layoutConfig || mission?.layoutConfig,
      lightroomAlbum: lightroomAlbum || null,
      enablePrints: enablePrints || false,
      printPricing: printPricing || undefined,
      images: images ? images.map((id, index) => ({
        imageId: id,
        order: index,
        layoutType: 'single',
      })) : [],
    });

    res.status(201).json(gallery);
  } catch (error) {
    console.error('Gallery creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle Lightroom photo visibility
router.post('/:id/toggle-photo', ensureAuth, async (req, res) => {
  try {
    const { photoId } = req.body;
    const gallery = await Gallery.findOne({ _id: req.params.id, userId: req.user._id });

    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found' });
    }

    if (!gallery.visibleLightroomPhotos) {
      gallery.visibleLightroomPhotos = [];
    }

    const index = gallery.visibleLightroomPhotos.indexOf(photoId);
    if (index > -1) {
      // Photo is visible, hide it
      gallery.visibleLightroomPhotos.splice(index, 1);
    } else {
      // Photo is hidden, show it
      gallery.visibleLightroomPhotos.push(photoId);
    }

    await gallery.save();
    res.json(gallery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhance Lightroom gallery with AI descriptions
router.post('/:id/enhance-lightroom', ensureAuth, async (req, res) => {
  try {
    const gallery = await Gallery.findOne({ _id: req.params.id, userId: req.user._id });

    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found' });
    }

    if (!gallery.lightroomAlbum) {
      return res.status(400).json({ error: 'This is not a Lightroom gallery' });
    }

    const { photos } = req.body; // Array of Lightroom photos with EXIF data

    if (!photos || !Array.isArray(photos)) {
      return res.status(400).json({ error: 'Photos array required' });
    }

    console.log(`🎨 Enhancing ${photos.length} Lightroom photos with AI...`);

    const { generatePhotoDescription } = await import('../services/aiService.js');
    const enhancedPhotos = [];

    for (const photo of photos) {
      try {
        // Extract EXIF from Lightroom photo data
        const exifData = {
          camera: photo.exif?.camera,
          lens: photo.exif?.lens,
          focalLength: photo.exif?.focalLength,
          aperture: photo.exif?.aperture,
          shutterSpeed: photo.exif?.shutterSpeed,
          iso: photo.exif?.iso,
          location: photo.exif?.location,
        };

        // Generate AI description
        const aiDescription = await generatePhotoDescription(exifData, photo.caption || '');

        enhancedPhotos.push({
          id: photo.id,
          aiDescription,
          exif: exifData,
        });

        console.log(`✅ Enhanced Lightroom photo: ${photo.id}`);
      } catch (error) {
        console.error(`❌ Failed to enhance photo ${photo.id}:`, error.message);
      }
    }

    // Store enhanced data in gallery metadata
    if (!gallery.metadata) {
      gallery.metadata = {};
    }
    gallery.metadata.enhancedLightroomPhotos = enhancedPhotos;
    await gallery.save();

    console.log('📊 Lightroom enhancement complete:', enhancedPhotos.length);
    res.json({ success: enhancedPhotos.length, enhancedPhotos });
  } catch (error) {
    console.error('❌ Error enhancing Lightroom gallery:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create and link Lightroom album for a gallery
router.post('/:id/create-lightroom-album', ensureAuth, async (req, res) => {
  try {
    const gallery = await Gallery.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('missionId');

    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found' });
    }

    if (gallery.lightroomAlbum && gallery.lightroomAlbum.id) {
      return res.status(400).json({ 
        error: 'Gallery already has a Lightroom album',
        album: gallery.lightroomAlbum 
      });
    }

    const { catalogId, albumName } = req.body;

    if (!catalogId) {
      return res.status(400).json({ error: 'Catalog ID required' });
    }

    // Use gallery title or mission title for album name
    const name = albumName || gallery.title || gallery.missionId?.title || 'New Album';

    console.log(`📸 Creating Lightroom album: ${name}`);
    console.log('Gallery current lightroomAlbum:', gallery.lightroomAlbum);
    
    // Get authorization header and ensure it has Bearer prefix
    let authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    
    // If token doesn't start with Bearer, add it
    if (!authHeader.startsWith('Bearer ')) {
      authHeader = `Bearer ${authHeader}`;
    }
    
    console.log('Request auth:', { 
      hasAuth: !!authHeader,
      authPrefix: authHeader.substring(0, 20) + '...',
      catalogId 
    });

    // Create album in Lightroom via Adobe API
    const axios = (await import('axios')).default;
    const baseUrl = `https://lr.adobe.io/v2/catalogs/${catalogId}`;
    
    const requestData = {
      subtype: 'collection',
      payload: {
        userCreated: true,
        name: name
      }
    };
    
    console.log('Creating album with data:', requestData);
    console.log('Adobe API URL:', `${baseUrl}/albums`);
    
    const response = await axios.post(
      `${baseUrl}/albums`,
      requestData,
      {
        headers: {
          'Authorization': authHeader,
          'X-API-Key': process.env.ADOBE_CLIENT_ID,
          'Content-Type': 'application/json'
        }
      }
    );

    const albumId = response.data.id;
    
    // Update gallery with Lightroom album info
    gallery.lightroomAlbum = {
      id: albumId,
      name: name,
      catalogId: catalogId
    };
    
    await gallery.save();

    console.log(`✅ Lightroom album created: ${albumId}`);
    res.json({ 
      album: gallery.lightroomAlbum,
      message: 'Lightroom album created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating Lightroom album:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.response?.data?.message || error.message 
    });
  }
});

// Enhance gallery description with AI
router.post('/:id/enhance-description', ensureAuth, async (req, res) => {
  try {
    const gallery = await Gallery.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('missionId');

    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found' });
    }

    const { enhanceGalleryDescription } = await import('../services/aiService.js');
    
    const imageCount = gallery.lightroomAlbum ? 
      (gallery.visibleLightroomPhotos?.length || 0) : 
      (gallery.images?.length || 0);
    
    const missionContext = gallery.missionId ? 
      `${gallery.missionId.title} - ${gallery.missionId.location || ''}` : '';

    const enhancedDescription = await enhanceGalleryDescription(
      gallery.title,
      gallery.description,
      imageCount,
      missionContext
    );

    gallery.description = enhancedDescription;
    await gallery.save();

    res.json({ description: enhancedDescription });
  } catch (error) {
    console.error('Error enhancing gallery description:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update gallery
router.put('/:id', ensureAuth, async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: Date.now() };
    const gallery = await Gallery.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
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
