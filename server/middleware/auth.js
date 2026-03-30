/**
 * @desc Protect routes — verifies JWT token
 * and attaches decoded user to req.user
 * @param {Object} req - Express request object
 *   req.user will contain { id, role, email }
 * @param {Object} res - Express response object
 * @param {Object} next - Express next function
 * @access Private
 */
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
