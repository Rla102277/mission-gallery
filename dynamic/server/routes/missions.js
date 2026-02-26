import express from 'express';
import Mission from '../models/Mission.js';
import { ensureAuth } from '../middleware/auth.js';
import { generateMissions, generateGearList, enhanceMissionSection } from '../services/aiService.js';

const router = express.Router();

const editableSections = {
  'gear-roles': 'gearRolesText',
  'base-recipes': 'baseRecipesText',
  'series-checklist': 'seriesChecklistText',
  'composition-notes': 'compositionNotesText',
  'field-card': 'fieldCardText',
};

// Get all missions for authenticated user
router.get('/', ensureAuth, async (req, res) => {
  try {
    const missions = await Mission.find({ userId: req.user._id }).sort({ createdAt: -1 });

// Update mission brief section
router.put('/:id/sections/:sectionKey', ensureAuth, async (req, res) => {
  try {
    const fieldName = editableSections[req.params.sectionKey];
    if (!fieldName) {
      return res.status(400).json({ error: 'Invalid section key' });
    }

    const mission = await Mission.findOne({ _id: req.params.id, userId: req.user._id });
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    mission[fieldName] = req.body.content || '';
    await mission.save();

    res.json({ field: fieldName, value: mission[fieldName] });
  } catch (error) {
    console.error('Error updating mission section:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI enhance mission brief section
router.post('/:id/sections/:sectionKey/enhance', ensureAuth, async (req, res) => {
  try {
    const fieldName = editableSections[req.params.sectionKey];
    if (!fieldName) {
      return res.status(400).json({ error: 'Invalid section key' });
    }

    const mission = await Mission.findOne({ _id: req.params.id, userId: req.user._id });
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const enhanced = await enhanceMissionSection(fieldName, mission, req.body?.style || 'default');
    mission[fieldName] = enhanced;
    await mission.save();

    res.json({ field: fieldName, value: enhanced });
  } catch (error) {
    console.error('Error enhancing mission section:', error);
    res.status(500).json({ error: error.message });
  }
});
    res.json(missions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single mission
router.get('/:id', ensureAuth, async (req, res) => {
  try {
    const mission = await Mission.findOne({ _id: req.params.id, userId: req.user._id });
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json(mission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new mission
router.post('/', ensureAuth, async (req, res) => {
  try {
    const mission = await Mission.create({
      ...req.body,
      userId: req.user._id,
    });
    res.status(201).json(mission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update mission
router.put('/:id', ensureAuth, async (req, res) => {
  try {
    const mission = await Mission.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json(mission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete mission
router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    const mission = await Mission.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json({ message: 'Mission deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI: Generate missions
router.post('/generate', ensureAuth, async (req, res) => {
  try {
    const { location, summary, includeDiptychs, includeTriptychs, gearRoles, duration, model } = req.body;
    
    if (!location || !summary) {
      return res.status(400).json({ error: 'Location and summary are required' });
    }

    const missions = await generateMissions(location, summary, {
      includeDiptychs,
      includeTriptychs,
      gearRoles,
      duration,
      model,
    });

    res.json({ missions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Link Lightroom album to mission
router.post('/:id/link-lightroom', ensureAuth, async (req, res) => {
  try {
    const mission = await Mission.findOne({ _id: req.params.id, userId: req.user._id });
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const { albumId, albumName, catalogId } = req.body;
    
    mission.lightroomAlbum = {
      id: albumId,
      name: albumName,
      catalogId: catalogId
    };
    
    await mission.save();
    res.json(mission);
  } catch (error) {
    console.error('Error linking Lightroom album:', error);
    res.status(500).json({ error: error.message });
  }
});

// Link photos to mission idea
router.post('/:id/ideas/:ideaId/link-photos', ensureAuth, async (req, res) => {
  try {
    const mission = await Mission.findOne({ _id: req.params.id, userId: req.user._id });
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const { imageIds, lightroomPhotoIds } = req.body;
    const ideaId = req.params.ideaId;
    
    // Find the mission idea
    const idea = mission.missionIdeas.find(i => i.id === ideaId);
    if (!idea) {
      return res.status(404).json({ error: 'Mission idea not found' });
    }
    
    // Add linked photos
    if (imageIds) {
      idea.linkedPhotos = [...new Set([...idea.linkedPhotos, ...imageIds])];
    }
    if (lightroomPhotoIds) {
      idea.lightroomPhotoIds = [...new Set([...idea.lightroomPhotoIds || [], ...lightroomPhotoIds])];
    }
    
    await mission.save();
    res.json(mission);
  } catch (error) {
    console.error('Error linking photos to mission idea:', error);
    res.status(500).json({ error: error.message });
  }
});

// Publish mission as gallery
router.post('/:id/publish-gallery', ensureAuth, async (req, res) => {
  try {
    const mission = await Mission.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('missionIdeas.linkedPhotos');
    
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    // Check if already published
    if (mission.publishedGalleryId) {
      const Gallery = (await import('../models/Gallery.js')).default;
      const existingGallery = await Gallery.findById(mission.publishedGalleryId);
      if (existingGallery) {
        return res.json({ gallery: existingGallery, message: 'Mission already published' });
      }
    }

    // Create gallery from mission
    const Gallery = (await import('../models/Gallery.js')).default;
    
    // Collect all linked photos
    const images = [];
    let order = 0;
    
    for (const idea of mission.missionIdeas) {
      if (idea.linkedPhotos && idea.linkedPhotos.length > 0) {
        for (const photo of idea.linkedPhotos) {
          images.push({
            imageId: photo._id || photo,
            order: order++,
            layoutType: 'single'
          });
        }
      }
    }
    
    const gallery = await Gallery.create({
      userId: req.user._id,
      missionId: mission._id,
      title: mission.title,
      description: mission.description || mission.summary,
      images: images,
      lightroomAlbum: mission.lightroomAlbum,
      isPublic: false, // Start as private
      layout: mission.layout || 'grid',
      layoutConfig: mission.layoutConfig || {}
    });
    
    // Update mission with published gallery reference
    mission.publishedGalleryId = gallery._id;
    await mission.save();
    
    res.json({ gallery, message: 'Gallery created successfully' });
  } catch (error) {
    console.error('Error publishing mission as gallery:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI: Generate gear list for mission
router.post('/:id/gear', ensureAuth, async (req, res) => {
  try {
    const mission = await Mission.findOne({ _id: req.params.id, userId: req.user._id });
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const gearList = await generateGearList(
      {
        title: mission.title,
        location: mission.location,
        description: mission.description,
        duration: req.body.duration,
      },
      req.body.userInputs || {}
    );

    mission.gearList = gearList.map(item => ({ ...item, aiGenerated: true }));
    await mission.save();

    res.json({ gearList: mission.gearList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
