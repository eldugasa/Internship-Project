import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { getEffectivePermissions } from "../utils/permissionResolver.js";

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
      },
    });

    if (!dbUser) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = {
      ...decoded,
      ...dbUser,
      permissions: Array.isArray(dbUser.permissions) ? dbUser.permissions : [],
      effectivePermissions: getEffectivePermissions(
        dbUser.role,
        Array.isArray(dbUser.permissions) ? dbUser.permissions : [],
      ),
    };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authenticate;
