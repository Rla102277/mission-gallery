import express from 'express';
import cloudinary from '../config/cloudinary.js';
import { ensureAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/cloudinary/folders?parent=mission-gallery
router.get('/folders', ensureAuth, async (req, res) => {
  try {
    const parent = req.query.parent || 'mission-gallery';
    const response = await cloudinary.api.sub_folders(parent);
    res.json({ parent, folders: response.folders || [] });
  } catch (error) {
    console.error('Cloudinary folders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/cloudinary/resources?prefix=mission-gallery&nextCursor=abc
router.get('/resources', ensureAuth, async (req, res) => {
  try {
    const prefix = req.query.prefix || 'mission-gallery';
    const maxResults = Math.min(parseInt(req.query.maxResults, 10) || 50, 100);
    const resourceOptions = {
      type: 'upload',
      prefix,
      max_results: maxResults,
      context: true,
      tags: true,
    };

    if (req.query.nextCursor) {
      resourceOptions.next_cursor = req.query.nextCursor;
    }

    const response = await cloudinary.api.resources(resourceOptions);
    res.json({
      prefix,
      resources: response.resources || [],
      nextCursor: response.next_cursor || null,
      totalCount: response.total_count,
    });
  } catch (error) {
    console.error('Cloudinary resources error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
