import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get('/google', (req, res, next) => {
  const requestedReturnTo = typeof req.query.returnTo === 'string' ? req.query.returnTo : '';
  const safeReturnTo = requestedReturnTo.startsWith('/') ? requestedReturnTo : '';

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: safeReturnTo,
  })(req, res, next);
});

const defaultClientUrl = 'https://mission-gallery-app.web.app';
const getClientUrl = () => process.env.CLIENT_URL || defaultClientUrl;

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${getClientUrl()}/login?error=oauth_failed`,
    session: false,
  }),
  (req, res) => {
    const requestedReturnTo = typeof req.query.state === 'string' ? req.query.state : '';
    const safeReturnTo = requestedReturnTo.startsWith('/') ? requestedReturnTo : '';

    // Create JWT token
    const token = jwt.sign(
      { 
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
      },
      process.env.SESSION_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    // Redirect with token in URL (will be stored in localStorage by frontend)
    const redirectBase = `${getClientUrl()}${safeReturnTo}`;
    const joiner = redirectBase.includes('?') ? '&' : '?';
    const redirectUrl = `${redirectBase}${joiner}token=${token}`;
    res.redirect(redirectUrl);
  }
);

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.redirect(getClientUrl());
  });
});

router.get('/user', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ user: null });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key');
    res.json({ user: decoded });
  } catch (error) {
    res.status(401).json({ user: null });
  }
});

export default router;
