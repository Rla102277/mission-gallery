import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const ensureAuth = async (req, res, next) => {
  // Check for JWT token in Authorization header
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key');
      
      // Attach user to request (fetch from DB to get full user object)
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
  
  // Fallback to session-based auth (for backward compatibility)
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ error: 'Not authenticated' });
};

export const ensureGuest = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
};
