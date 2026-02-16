// backend/src/middleware/role.middleware.js

// Normalize any role format to a common format:
// e.g. "admin", "ADMIN", "project-manager" -> "ADMIN", "PROJECT_MANAGER"
const normalizeRole = (role = "") =>
  role.toString().trim().toUpperCase().replace(/-/g, "_");

export const authorize = (...allowedRoles) => {
  // Normalize allowed roles once when middleware is created
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  return (req, res, next) => {
    // Reject if token/user role is missing
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: "Access denied" });
    }

    const normalizedUserRole = normalizeRole(req.user.role);

    // Compare normalized values to avoid case/format mismatch bugs
    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        error: "Forbidden: insufficient role",
        yourRole: req.user.role,
        normalizedRole: normalizedUserRole,
        allowedRoles,
        normalizedAllowedRoles,
      });
    }

    next();
  };
};
