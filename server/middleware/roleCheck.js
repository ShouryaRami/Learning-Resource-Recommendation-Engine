/**
 * adminOnly middleware — restricts route access to users with role 'admin'.
 * Must be used after the protect middleware so req.user is populated.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};

module.exports = { adminOnly };
