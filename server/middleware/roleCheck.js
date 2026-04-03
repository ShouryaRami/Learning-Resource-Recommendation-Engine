/**
 * @desc Restrict route access to admin role only
 * @requires protect middleware to run first so
 *   req.user is available
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express next function
 * @access Admin only
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};

/**
 * @desc Restricts route access to admin or faculty roles
 * @param {Object} req - Express request (requires req.user)
 * @param {Object} res - Express response
 * @param {Object} next - Express next function
 */
const facultyOrAbove = (req, res, next) => {
  if (req.user && ['admin', 'faculty'].includes(req.user.role)) {
    return next()
  }
  return res.status(403).json({ message: 'Faculty access required' })
}

/**
 * @desc Restricts route to admin, faculty, or TA roles
 * @param {Object} req - Express request (requires req.user)
 * @param {Object} res - Express response
 * @param {Object} next - Express next function
 */
const taOrAbove = (req, res, next) => {
  if (req.user && ['admin', 'faculty', 'ta'].includes(req.user.role)) {
    return next()
  }
  return res.status(403).json({ message: 'TA access required' })
}

module.exports = { adminOnly, facultyOrAbove, taOrAbove };
