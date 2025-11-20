import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import axios from 'axios';
import { ensureAuth } from '../middleware/auth.js';
import { generateImageDescription, enhanceMissionSection, generateGearList, generateGalleryDescriptions } from '../services/aiService.js';

const router = express.Router();

// Multer config for temporary uploads
const upload = multer({ dest: 'uploads/' });

// POST /api/mentor/upload
router.post('/upload', ensureAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { filename, path: tempPath } = req.file;
    const ext = path.extname(filename).toLowerCase();
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    // Move file to permanent uploads location (if not already there)
    const targetPath = path.join('uploads', filename);
    await fs.rename(tempPath, targetPath);
    res.json({ filename, url: publicUrl, path: targetPath });
  } catch (err) {
    console.error('MentorEdit upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/mentor/import-lightroom
router.post('/import-lightroom', ensureAuth, async (req, res) => {
  try {
    const { albumId } = req.body;
    if (!albumId) return res.status(400).json({ error: 'albumId required' });
    // Get Lightroom token from user session or stored token (assume sent in header or body)
    const token = req.headers['x-adobe-token'] || req.body.adobeToken;
    if (!token) return res.status(401).json({ error: 'Adobe token missing' });
    // List assets in album
    const assetsUrl = `https://lr.adobe.io/v2/catalogs/${req.body.catalogId || 'default'}/albums/${albumId}/assets`;
    const assetsRes = await axios.get(assetsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Api-Key': process.env.VITE_ADOBE_CLIENT_ID,
      },
    });
    const assets = assetsRes.data.resources;
    if (!assets || assets.length === 0) {
      return res.status(404).json({ error: 'No assets found in album' });
    }
    // Pick the first asset
    const firstAsset = assets[0];
    const assetId = firstAsset.id;
    // Get a rendition (preview) URL for the asset
    const renditionUrl = `https://lr.adobe.io/v2/catalogs/${req.body.catalogId || 'default'}/assets/${assetId}/renditions`;
    const renditionRes = await axios.get(renditionUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Api-Key': process.env.VITE_ADOBE_CLIENT_ID,
      },
    });
    const renditions = renditionRes.data.resources;
    if (!renditions || renditions.length === 0) {
      return res.status(404).json({ error: 'No rendition found for asset' });
    }
    // Use the first rendition (preferably a full-size one)
    const rendition = renditions.find(r => r.type && r.type.includes('image')) || renditions[0];
    const imageUrl = rendition._links['https://ns.adobe.com/adobecloud/rendition/get'].href;
    // Download the image
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageRes.data, 'binary');
    // Save to uploads folder
    const filename = `mentor_lr_${assetId}_${Date.now()}.jpg`;
    const targetPath = path.join('uploads', filename);
    await fs.writeFile(targetPath, imageBuffer);
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    res.json({ filename, url: publicUrl, path: targetPath });
  } catch (err) {
    console.error('MentorEdit Lightroom import error:', err);
    res.status(500).json({ error: 'Lightroom import failed' });
  }
});

// POST /api/mentor/crop
router.post('/crop', ensureAuth, async (req, res) => {
  try {
    const { imagePath } = req.body;
    if (!imagePath) return res.status(400).json({ error: 'imagePath required' });
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    // Helper: center crop to aspect ratio
    const centerCrop = (img, aspectW, aspectH) => {
      const targetRatio = aspectW / aspectH;
      const imgRatio = width / height;
      let cropW, cropH;
      if (imgRatio > targetRatio) {
        cropH = height;
        cropW = Math.round(height * targetRatio);
      } else {
        cropW = width;
        cropH = Math.round(width / targetRatio);
      }
      const left = Math.floor((width - cropW) / 2);
      const top = Math.floor((height - cropH) / 2);
      return img.extract({ left, top, width: cropW, height: cropH });
    };

    // 4:5 portrait
    const portrait = await centerCrop(image.clone(), 4, 5)
      .resize({ width: 800, height: 1000, fit: sharp.fit.cover })
      .png()
      .toBuffer();

    // 2:1 panorama (trim sky/top)
    const pano = await image.clone()
      .extract({ left: 0, top: Math.floor(height * 0.15), width, height: Math.floor(height * 0.7) })
      .resize({ width: 1200, height: 600, fit: sharp.fit.cover })
      .png()
      .toBuffer();

    // Tight 3:2 landscape
    const tight = await centerCrop(image.clone(), 3, 2)
      .resize({ width: 1200, height: 800, fit: sharp.fit.cover })
      .png()
      .toBuffer();

    // Write temporary files and return URLs
    const basename = path.basename(imagePath, path.extname(imagePath));
    const writeAndReturn = async (buf, suffix) => {
      const outPath = path.join('uploads', `${basename}_${suffix}.png`);
      await fs.writeFile(outPath, buf);
      return `${req.protocol}://${req.get('host')}/uploads/${path.basename(outPath)}`;
    };

    const [portraitUrl, panoUrl, tightUrl] = await Promise.all([
      writeAndReturn(portrait, 'portrait'),
      writeAndReturn(pano, 'pano'),
      writeAndReturn(tight, 'tight')
    ]);

    res.json({ portrait: portraitUrl, pano: panoUrl, tight: tightUrl });
  } catch (err) {
    console.error('MentorEdit crop error:', err);
    res.status(500).json({ error: 'Crop generation failed' });
  }
});

// POST /api/mentor/quickedit
router.post('/quickedit', ensureAuth, async (req, res) => {
  try {
    const { imagePath, edits = {} } = req.body;
    if (!imagePath) return res.status(400).json({ error: 'imagePath required' });
    // Apply global edits using Sharp (simplified: exposure/contrast via gamma, brightness, and modulation)
    let pipeline = sharp(imagePath);
    // Basic exposure/contrast via gamma and brightness
    const exposure = edits.exposure ?? 0.35;
    const contrast = edits.contrast ?? 10;
    const brightness = 1 + exposure * 0.5; // crude mapping
    const gamma = 1 - (contrast / 200); // crude mapping
    pipeline = pipeline.gamma(gamma).linear(brightness, 0);
    // HSL via modulation (very basic)
    const hueShift = edits.orangeHue ?? -5;
    const saturation = 1 + (edits.orangeSaturation ?? 10) / 100;
    pipeline = pipeline.modulate({
      brightness: 1,
      saturation,
      hue: hueShift,
    });
    // Write temporary edited file
    const ext = path.extname(imagePath);
    const basename = path.basename(imagePath, ext);
    const editedPath = path.join('uploads', `${basename}_edited${ext}`);
    await pipeline.toFile(editedPath);
    const editedUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(editedPath)}`;
    res.json({ previewUrl: editedUrl });
  } catch (err) {
    console.error('MentorEdit quickedit error:', err);
    res.status(500).json({ error: 'Quick edit failed' });
  }
});

// POST /api/mentor/critique
router.post('/critique', ensureAuth, async (req, res) => {
  try {
    const { imagePath } = req.body;
    if (!imagePath) return res.status(400).json({ error: 'imagePath required' });
    // Generate critique using AI service
    const critique = await generateImageDescription(imagePath, 'Provide a blunt, structured critique: Story/Subject, Composition/Crop, Light/Color, Technical, Post choices; include action list and slider targets.');
    res.json({ critique });
  } catch (err) {
    console.error('MentorEdit critique error:', err);
    res.status(500).json({ error: 'Critique generation failed' });
  }
});

// GET /api/mentor/preset
router.get('/preset', ensureAuth, async (req, res) => {
  try {
    // Generate a .xmp preset file for the global edit parameters
    const presetXmp = `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 6.0.0">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/">
      <crs:Exposure2012>+0.35</crs:Exposure2012>
      <crs:Contrast2012>+10</crs:Contrast2012>
      <crs:Highlights2012>-45</crs:Highlights2012>
      <crs:Shadows2012>+20</crs:Shadows2012>
      <crs:Whites2012>+12</crs:Whites2012>
      <crs:Blacks2012>-12</crs:Blacks2012>
      <crs:Texture>+15</crs:Texture>
      <crs:Clarity2012>+5</crs:Clarity2012>
      <crs:Dehaze>+12</crs:Dehaze>
      <crs:PostCropVignetteAmount>-8</crs:PostCropVignetteAmount>
      <!-- HSL adjustments would go here -->
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`;
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="MentorEdit_Global.xmp"');
    res.send(presetXmp);
  } catch (err) {
    console.error('MentorEdit preset error:', err);
    res.status(500).json({ error: 'Preset generation failed' });
  }
});

export default router;
