export const requirePermission = (...neededPermissions) => {
  const normalizedNeededPermissions = neededPermissions
    .filter(Boolean)
    .map((permission) => permission.toString().trim().toLowerCase());

  return (req, res, next) => {
    const userPermissions = req.user?.effectivePermissions || [];

    if (userPermissions.includes("*")) {
      return next();
    }

    const allowed = normalizedNeededPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!allowed) {
      return res.status(403).json({
        message: "Forbidden: insufficient permission",
      });
    }

    next();
  };
};

export const requireAnyPermission = (...neededPermissions) => {
  const normalizedNeededPermissions = neededPermissions
    .filter(Boolean)
    .map((permission) => permission.toString().trim().toLowerCase());

  return (req, res, next) => {
    const userPermissions = req.user?.effectivePermissions || [];

    if (userPermissions.includes("*")) {
      return next();
    }

    const allowed = normalizedNeededPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!allowed) {
      return res.status(403).json({
        message: "Forbidden: insufficient permission",
      });
    }

    next();
  };
};
