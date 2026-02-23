import { prisma } from "../config/db.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";
import { createNotification, createBulkNotifications, NOTIFICATION_TYPES } from '../utils/notificationHelper.js';

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

    // Send notification to admins about new user registration
    try {
      const admins = await prisma.user.findMany({ 
        where: { role: 'admin' } 
      });
      
      if (admins.length > 0) {
        await createBulkNotifications(
          admins.map(admin => ({
            userId: admin.id,
            type: NOTIFICATION_TYPES.USER_REGISTERED,
            title: 'New User Registered',
            message: `${user.name} (${user.email}) joined the platform`,
            data: { userId: user.id },
            link: `/admin/users/${user.id}`
          }))
        );
      }
    } catch (notifErr) {
      console.error('Error sending registration notifications:', notifErr);
      // Don't fail registration if notifications fail
    }

    // Generate token for the newly registered user
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Registration error:', err);
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
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
};

export { register, login };