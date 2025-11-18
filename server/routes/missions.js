import express from 'express';
import Mission from '../models/Mission.js';
import { ensureAuth } from '../middleware/auth.js';
import { generateMissions, generateGearList } from '../services/aiService.js';

const router = express.Router();

// Get all missions for authenticated user
router.get('/', ensureAuth, async (req, res) => {
  try {
    const missions = await Mission.find({ userId: req.user._id }).sort({ createdAt: -1 });
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
