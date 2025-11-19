import express from 'express';
import Gear from '../models/Gear.js';
import { ensureAuth } from '../middleware/auth.js';
import { generateGearContent } from '../services/aiService.js';

const router = express.Router();

// Get published gear (public)
router.get('/published', async (req, res) => {
  try {
    const gear = await Gear.findOne({ isPublished: true });
    res.json(gear || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get gear for editing (auth required)
router.get('/', ensureAuth, async (req, res) => {
  try {
    const gear = await Gear.findOne({ userId: req.user._id });
    res.json(gear || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate gear content with AI
router.post('/generate', ensureAuth, async (req, res) => {
  try {
    const { gearList } = req.body;
    
    if (!gearList || !gearList.trim()) {
      return res.status(400).json({ error: 'Gear list is required' });
    }
    
    console.log('🎨 Generating gear content for:', gearList.substring(0, 100) + '...');
    const refinedContent = await generateGearContent(gearList);
    console.log('✅ Gear content generated successfully');
    
    res.json({ refinedContent });
  } catch (error) {
    console.error('❌ Error generating gear content:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate content',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Save gear
router.post('/', ensureAuth, async (req, res) => {
  try {
    const { rawGearList, refinedContent, isPublished } = req.body;

    let gear = await Gear.findOne({ userId: req.user._id });

    if (gear) {
      gear.rawGearList = rawGearList;
      gear.refinedContent = refinedContent;
      gear.isPublished = isPublished;
      await gear.save();
    } else {
      gear = await Gear.create({
        userId: req.user._id,
        rawGearList,
        refinedContent,
        isPublished
      });
    }

    res.json(gear);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
