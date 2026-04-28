const User = require('../models/User')

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
 * @desc Restricts route access to admin or instructor roles.
 *   Checks the database so role upgrades take effect without re-login.
 * @param {Object} req - Express request (requires req.user)
 * @param {Object} res - Express response
 * @param {Object} next - Express next function
 */
const instructorOrAbove = async (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: 'Instructor access required' })
  }
  if (req.user.role === 'admin') return next()
  try {
    const user = await User.findById(req.user.id).select('role')
    if (user && ['admin', 'instructor'].includes(user.role)) return next()
  } catch (err) {
    console.error('instructorOrAbove DB check error:', err.message)
  }
  return res.status(403).json({ message: 'Instructor access required' })
}

/**
 * @desc Restricts route to admin or instructors who are department heads.
 *   isDepartmentHead is a boolean flag on the instructor role — not a
 *   separate role — so we check role AND the flag together.
 *   Checks the database directly so the flag takes effect without re-login.
 * @param {Object} req - Express request (requires req.user)
 * @param {Object} res - Express response
 * @param {Object} next - Express next function
 */
const deptHeadOrAbove = async (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: 'Department head access required' })
  }
  if (req.user.role === 'admin') return next()
  try {
    const user = await User.findById(req.user.id).select('role isDepartmentHead')
    if (user && user.role === 'instructor' && user.isDepartmentHead) return next()
  } catch (err) {
    console.error('deptHeadOrAbove DB check error:', err.message)
  }
  return res.status(403).json({ message: 'Department head access required' })
}

/**
 * @desc Restricts route to admin, instructor, or TA roles
 * @param {Object} req - Express request (requires req.user)
 * @param {Object} res - Express response
 * @param {Object} next - Express next function
 */
const taOrAbove = (req, res, next) => {
  if (req.user && ['admin', 'instructor', 'ta'].includes(req.user.role)) {
    return next()
  }
  return res.status(403).json({ message: 'TA access required' })
}

module.exports = { adminOnly, instructorOrAbove, deptHeadOrAbove, taOrAbove };
