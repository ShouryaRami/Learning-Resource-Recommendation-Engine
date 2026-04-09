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
 * @desc Restricts route access to admin or instructor roles
 * @param {Object} req - Express request (requires req.user)
 * @param {Object} res - Express response
 * @param {Object} next - Express next function
 */
const instructorOrAbove = (req, res, next) => {
  if (req.user && ['admin', 'instructor'].includes(req.user.role)) {
    return next()
  }
  return res.status(403).json({ message: 'Instructor access required' })
}

/**
 * @desc Restricts route to admin or instructors who are department heads.
 *   isDepartmentHead is a boolean flag on the instructor role — not a
 *   separate role — so we check role AND the flag together.
 * @param {Object} req - Express request (requires req.user)
 * @param {Object} res - Express response
 * @param {Object} next - Express next function
 */
const deptHeadOrAbove = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: 'Access denied' })
  }
  const isAdmin = req.user.role === 'admin'
  const isDeptHead = req.user.role === 'instructor' && req.user.isDepartmentHead === true
  if (isAdmin || isDeptHead) {
    return next()
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
