import { prisma } from "../config/db.js";

import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";
import { createNotification, NOTIFICATION_TYPES } from '../utils/notificationHelper.js';

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      }
    });
    const admins = await prisma.user.findMany({ where: { role: 'admin' } });
await createBulkNotifications(
  admins.map(admin => ({
    userId: admin.id,
    type: NOTIFICATION_TYPES.USER_REGISTERED,
    title: 'New User Registered',
    message: `${newUser.name} (${newUser.email}) joined the platform`,
    data: { userId: newUser.id },
    link: `/admin/users/${newUser.id}`
  }))
);

    // Generate token for the newly registered user
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { register, login };
