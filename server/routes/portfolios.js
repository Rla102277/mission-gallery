import express from 'express';
import Portfolio from '../models/Portfolio.js';
import Gallery from '../models/Gallery.js';
import Mission from '../models/Mission.js';
import { ensureAuth } from '../middleware/auth.js';

const router = express.Router();

const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const sanitizePortfolioResponse = (portfolio) => {
  if (!portfolio) return null;
  const obj = portfolio.toObject ? portfolio.toObject() : portfolio;
  return {
    _id: obj._id,
    title: obj.title,
    slug: obj.slug,
    heroImage: obj.heroImage,
    aboutContent: obj.aboutContent,
    gearSummary: obj.gearSummary,
    layout: obj.layout,
    galleries: obj.galleries || obj.galleryIds || [],
    settings: obj.settings || {},
    featuredMission: obj.featuredMissionId || null,
    updatedAt: obj.updatedAt,
  };
};

// Authenticated routes
router.get('/', ensureAuth, async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ userId: req.user._id })
      .populate('galleryIds')
      .sort({ updatedAt: -1 });
    res.json(portfolios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', ensureAuth, async (req, res) => {
  try {
    const {
      title,
      slug,
      heroImage,
      aboutContent,
      gearSummary,
      galleryIds = [],
      layout = 'simple',
      featuredMissionId,
      settings = {},
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    let uniqueSlug = slug?.trim();
    if (uniqueSlug) {
      uniqueSlug = slugify(uniqueSlug);
      const existing = await Portfolio.findOne({ slug: uniqueSlug });
      if (existing) {
        return res.status(400).json({ error: 'Slug already in use' });
      }
    }

    const portfolio = await Portfolio.create({
      userId: req.user._id,
      title,
      slug: uniqueSlug || undefined,
      heroImage: heroImage ? (typeof heroImage === 'string' ? { url: heroImage } : heroImage) : undefined,
      aboutContent,
      gearSummary,
      galleryIds,
      layout,
      featuredMissionId,
      settings,
    });

    res.status(201).json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', ensureAuth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ _id: req.params.id, userId: req.user._id }).populate('galleryIds');
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', ensureAuth, async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: Date.now() };
    if (updates.slug) {
      updates.slug = slugify(updates.slug);
      const exists = await Portfolio.findOne({ slug: updates.slug, _id: { $ne: req.params.id } });
      if (exists) {
        return res.status(400).json({ error: 'Slug already in use' });
      }
    }

    if (updates.heroImage && typeof updates.heroImage === 'string') {
      updates.heroImage = { url: updates.heroImage };
    }

    const portfolio = await Portfolio.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
      { new: true }
    ).populate('galleryIds');

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    res.json({ message: 'Portfolio deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/publish', ensureAuth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ _id: req.params.id, userId: req.user._id });
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    let slug = req.body.slug || portfolio.slug || slugify(portfolio.title);
    slug = slugify(slug);
    if (!slug) {
      slug = `portfolio-${Date.now().toString(36)}`;
    }

    const exists = await Portfolio.findOne({ slug, _id: { $ne: portfolio._id } });
    if (exists) {
      return res.status(400).json({ error: 'Slug already in use' });
    }

    portfolio.slug = slug;
    portfolio.isPublished = true;
    portfolio.status = 'published';
    await portfolio.save();

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/unpublish', ensureAuth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ _id: req.params.id, userId: req.user._id });
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    portfolio.isPublished = false;
    portfolio.status = 'draft';
    await portfolio.save();
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public route
router.get('/public/:slug', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ slug: req.params.slug, isPublished: true })
      .populate({
        path: 'galleryIds',
        match: { isPublic: true },
        populate: { path: 'images.imageId' },
      })
      .populate('featuredMissionId');

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const galleries = (portfolio.galleryIds || []).map((gallery) => {
      const images = (gallery.images || [])
        .filter((image) => image.imageId?.isPublic)
        .map((image) => ({
          _id: image._id,
          imageId: {
            _id: image.imageId?._id,
            path: image.imageId?.path,
            thumbnailPath: image.imageId?.thumbnailPath,
            caption: image.imageId?.caption,
          },
        }));

      return {
        _id: gallery._id,
        title: gallery.title,
        slug: gallery.slug,
        description: gallery.description,
        images,
      };
    });

    const response = sanitizePortfolioResponse({
      ...portfolio.toObject(),
      galleries,
      featuredMissionId: portfolio.featuredMissionId,
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
