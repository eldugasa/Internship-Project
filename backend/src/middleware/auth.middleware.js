import { prisma } from "../config/db.js";
import { getEffectivePermissions } from "../utils/permissionResolver.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { ACCESS_TOKEN_COOKIE } from "../utils/authCookies.js";

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;
  const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE];
  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = verifyAccessToken(token);
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
