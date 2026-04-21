import { prisma } from "../config/db.js";
import { comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";
import { createNotification } from '../utils/notificationHelper.js';
import jwt from 'jsonwebtoken';
import { sendPasswordResetEmail } from '../utils/email.js';

const normalizeEmail = (email = "") => email.toString().trim().toLowerCase();

const register = async (req, res) => {
  return res.status(403).json({
    message: "Self-signup is disabled. Contact an admin to create your account.",
  });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
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
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
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
