// middleware/roleMiddleware.js
// Restricts a route to one or more specific roles (e.g. 'ADMIN').
// Must be used AFTER authMiddleware, since it relies on req.user
// already being set.
//
// Usage example (added in a later step, once we build protected routes):
//   router.get('/admin-only', authMiddleware, roleMiddleware('ADMIN'), controllerFn);

function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }

    next();
  };
}

module.exports = roleMiddleware;