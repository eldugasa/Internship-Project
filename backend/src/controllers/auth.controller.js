import { prisma } from "../config/db.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";
import { createNotification, createBulkNotifications, NOTIFICATION_TYPES } from '../utils/notificationHelper.js';
import jwt from 'jsonwebtoken';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email.js'; // ✅ Add email imports

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

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
      console.log(`✅ Welcome email sent to ${user.email}`);
    } catch (emailErr) {
      console.error('❌ Failed to send welcome email:', emailErr);
      // Don't fail registration if email fails
    }

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

//  FORGOT PASSWORD FUNCTION
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // For security, don't reveal that user doesn't exist
      return res.status(200).json({ 
        message: "If an account exists with this email, you will receive a password reset link" 
      });
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email 
      },
      process.env.JWT_SECRET + user.password, // Add password hash to make token unique
      { expiresIn: "1h" }
    );

    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 3600000) // 1 hour from now
      }
    });

    // ✅ SEND ACTUAL EMAIL
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name);
      console.log(`✅ Password reset email sent successfully to ${user.email}`);
    } catch (emailErr) {
      console.error('❌ Failed to send password reset email:', emailErr);
      // Don't fail the request, but log it
    }

    // Create notification for user
    try {
      await createNotification({
        userId: user.id,
        type: 'password_reset',
        title: 'Password Reset Requested',
        message: 'A password reset link has been sent to your email',
        data: { email: user.email }
      });
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    res.status(200).json({ 
      message: "If an account exists with this email, you will receive a password reset link",
      // In development, return token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ RESET PASSWORD FUNCTION
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // First decode token without verification to get user ID
    let decoded;
    try {
      decoded = jwt.decode(token);
    } catch (err) {
      return res.status(400).json({ message: "Invalid token format" });
    }

    if (!decoded || !decoded.id) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if token exists in database
    if (user.resetToken !== token) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    // Check if token has expired
    if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ message: "Reset link has expired" });
    }

    // Verify token with user's password hash
    try {
      jwt.verify(token, process.env.JWT_SECRET + user.password);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(400).json({ message: "Reset link has expired" });
      }
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password and clear reset token fields
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    // Send notification to user
    try {
      await createNotification({
        userId: user.id,
        type: 'password_changed',
        title: 'Password Changed Successfully',
        message: 'Your password has been updated',
        data: { timestamp: new Date().toISOString() }
      });
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    res.status(200).json({ message: "Password reset successful" });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: err.message });
  }
};

export { register, login, forgotPassword, resetPassword };