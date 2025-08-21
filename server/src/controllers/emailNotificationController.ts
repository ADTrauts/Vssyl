import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { EmailNotificationService } from '../services/emailNotificationService';

// Test email service (admin only)
export const testEmailService = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { email = user.email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const emailService = EmailNotificationService.getInstance();
    
    if (!emailService.isAvailable()) {
      return res.status(503).json({ error: 'Email service not configured' });
    }

    const success = await emailService.testEmail(email);

    if (success) {
      res.json({ success: true, message: 'Test email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send test email' });
    }
  } catch (error) {
    console.error('Error testing email service:', error);
    res.status(500).json({ error: 'Failed to test email service' });
  }
};

// Get email service status
export const getEmailServiceStatus = async (req: Request, res: Response) => {
  try {
    const emailService = EmailNotificationService.getInstance();
    
    res.json({
      available: emailService.isAvailable(),
      configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    });
  } catch (error) {
    console.error('Error getting email service status:', error);
    res.status(500).json({ error: 'Failed to get email service status' });
  }
};

// Send email notification to user (admin only)
export const sendEmailNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { targetUserId, subject, html, text } = req.body;

    if (!targetUserId || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const emailService = EmailNotificationService.getInstance();
    
    if (!emailService.isAvailable()) {
      return res.status(503).json({ error: 'Email service not configured' });
    }

    const template = {
      subject,
      html,
      text: text || ''
    };

    const success = await emailService.sendToUser(targetUserId, template);

    if (success) {
      res.json({ success: true, message: 'Email notification sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send email notification' });
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    res.status(500).json({ error: 'Failed to send email notification' });
  }
};

// Get user email preferences
export const getUserEmailPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await prisma.userPreference.findMany({
      where: { 
        userId,
        key: { startsWith: 'email_' }
      }
    });

    const emailPreferences = preferences.reduce((acc, pref) => {
      const key = pref.key.replace('email_', '');
      acc[key] = pref.value === 'true';
      return acc;
    }, {} as Record<string, boolean>);

    res.json({ preferences: emailPreferences });
  } catch (error) {
    console.error('Error getting user email preferences:', error);
    res.status(500).json({ error: 'Failed to get email preferences' });
  }
};

// Update user email preferences
export const updateUserEmailPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Invalid preferences data' });
    }

    const updates = Object.entries(preferences).map(([key, value]) => ({
      userId,
      key: `email_${key}`,
      value: String(value)
    }));

    await Promise.all(
      updates.map(update =>
        prisma.userPreference.upsert({
          where: { userId_key: { userId: update.userId, key: update.key } },
          update: { value: update.value },
          create: update
        })
      )
    );

    res.json({ success: true, message: 'Email preferences updated successfully' });
  } catch (error) {
    console.error('Error updating email preferences:', error);
    res.status(500).json({ error: 'Failed to update email preferences' });
  }
}; 