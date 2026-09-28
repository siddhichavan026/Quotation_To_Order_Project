// middleware/authMiddleware.js
// Reads the JWT from the Authorization header, verifies it, and attaches
// the decoded user info (user_id, role) to req.user so later routes/
// controllers can use it.

const jwt = require('jsonwebtoken');
require('dotenv').config();

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid authorization header format.' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded contains: { user_id, role, iat, exp }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = authMiddleware;