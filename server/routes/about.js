import express from 'express';
import About from '../models/About.js';
import { ensureAuth } from '../middleware/auth.js';
import { refineAboutText } from '../services/aiService.js';

const router = express.Router();

// Get user's about page (authenticated)
router.get('/', ensureAuth, async (req, res) => {
  try {
    const about = await About.findOne({ userId: req.user._id });
    res.json(about || { rawText: '', refinedText: '', style: 'professional', isPublished: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get public about page by user ID
router.get('/public/:userId', async (req, res) => {
  try {
    const about = await About.findOne({ userId: req.params.userId, isPublished: true });
    if (!about) {
      return res.status(404).json({ error: 'About page not found or not published' });
    }
    res.json({ refinedText: about.refinedText, style: about.style });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update about page
router.post('/', ensureAuth, async (req, res) => {
  try {
    const { rawText, refinedText, style, isPublished } = req.body;
    
    let about = await About.findOne({ userId: req.user._id });
    
    if (about) {
      about.rawText = rawText || about.rawText;
      about.refinedText = refinedText || about.refinedText;
      about.style = style || about.style;
      about.isPublished = isPublished !== undefined ? isPublished : about.isPublished;
      await about.save();
    } else {
      about = await About.create({
        userId: req.user._id,
        rawText,
        refinedText: refinedText || rawText,
        style: style || 'professional',
        isPublished: isPublished || false,
      });
    }
    
    res.json(about);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI refine about text
router.post('/refine', ensureAuth, async (req, res) => {
  try {
    const { rawText, style } = req.body;
    
    if (!rawText) {
      return res.status(400).json({ error: 'Raw text is required' });
    }
    
    const result = await refineAboutText(rawText, style || 'professional');
    
    // Update the about page with refined text
    let about = await About.findOne({ userId: req.user._id });
    if (about) {
      about.rawText = rawText;
      about.refinedText = result.refinedText;
      about.style = style || about.style;
      await about.save();
    } else {
      about = await About.create({
        userId: req.user._id,
        rawText,
        refinedText: result.refinedText,
        style: style || 'professional',
      });
    }
    
    res.json({ about, suggestions: result.suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle publish status
router.patch('/publish', ensureAuth, async (req, res) => {
  try {
    const about = await About.findOne({ userId: req.user._id });
    if (!about) {
      return res.status(404).json({ error: 'About page not found' });
    }
    
    about.isPublished = !about.isPublished;
    await about.save();
    
    res.json(about);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
