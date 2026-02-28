// backend/src/utils/email.js
import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  // For development/testing with Ethereal (fake SMTP service)
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    console.log('📧 Using Ethereal email for testing');
    // Create test account on ethereal.email
    return nodemailer.createTestAccount().then(testAccount => {
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    });
  }

  // Production with real SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken, name) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"TaskFlow" <${process.env.SMTP_USER || 'noreply@taskflow.com'}>`,
      to: email,
      subject: 'Password Reset Request - TaskFlow',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4DA5AD 0%, #2D4A6B 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #4DA5AD; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .button:hover { background: #2D4A6B; }
            .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
            .warning { color: #e74c3c; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${name || 'User'}</strong>,</p>
              <p>We received a request to reset your password for your TaskFlow account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy this link to your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetUrl}</p>
              <div class="warning">
                ⚠️ This link will expire in <strong>1 hour</strong>.
              </div>
              <p>If you didn't request this, please ignore this email or contact support.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} TaskFlow. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request - TaskFlow
        
        Hello ${name || 'User'},
        
        We received a request to reset your password.
        
        Click this link to reset your password: ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log the preview URL when using Ethereal/test accounts
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 Preview URL:', previewUrl);
    }
    console.log(`📧 Password reset email sent to ${email}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"TaskFlow" <${process.env.SMTP_USER || 'noreply@taskflow.com'}>`,
      to: email,
      subject: 'Welcome to TaskFlow!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <h1>Welcome to TaskFlow, ${name}!</h1>
          <p>We're excited to have you on board.</p>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    throw error;
  }
};