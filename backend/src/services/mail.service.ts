import nodemailer from 'nodemailer';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

class MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const user = config.MAIL_USER;
    const pass = config.MAIL_PASS;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
      logger.info('📧 MailService configured successfully with Gmail credentials');
    } else {
      logger.warn('⚠️ MailService credentials missing. Running in MOCK mode (OTP codes will only log to console).');
    }
  }

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTPEmail(email: string, otp: string): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Welcome to StudyHub!</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #6366f1; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    if (!this.transporter) {
      logger.info(`[MOCK EMAIL] To: ${email} | Subject: StudyHub - Email Verification Code | Body: OTP = ${otp}`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: config.MAIL_USER,
        to: email,
        subject: 'StudyHub - Email Verification Code',
        html: htmlContent
      });
      logger.info(`OTP email successfully dispatched to ${email}`);
      return true;
    } catch (err: any) {
      logger.error(`Failed to dispatch OTP email to ${email}: ${err.message}`);
      return false;
    }
  }
}

export const mailService = new MailService();
