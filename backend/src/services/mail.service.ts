import nodemailer from 'nodemailer';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private mailUser: string = '';
  private isVerified: boolean = false;
  private lastVerificationError: string | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): void {
    const rawUser =
      process.env.SMTP_USER ||
      process.env.GMAIL_USER ||
      process.env.MAIL_USER ||
      config.MAIL_USER ||
      '';
    const rawPass =
      process.env.SMTP_PASS ||
      process.env.GMAIL_PASS ||
      process.env.MAIL_PASS ||
      config.MAIL_PASS ||
      '';

    const user = rawUser.replace(/^["']|["']$/g, '').trim();
    const pass = rawPass.replace(/^["']|["']$/g, '').trim();

    this.mailUser = user;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: (process.env.SMTP_SECURE ?? 'true') === 'true',
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      const maskedUser = user.length > 5 ? `${user.substring(0, 3)}***@${user.split('@')[1]}` : user;
      logger.info(`📧 MailService initializing SMTP transporter for user: ${maskedUser}`);

      this.verifyTransporter();
    } else {
      logger.warn('⚠️ MailService credentials missing. Running in MOCK / DEV Fallback mode.');
    }
  }

  public async verifyTransporter(): Promise<boolean> {
    if (!this.transporter) {
      this.isVerified = false;
      this.lastVerificationError = 'Transporter not configured (missing credentials)';
      return false;
    }

    try {
      await this.transporter.verify();
      this.isVerified = true;
      this.lastVerificationError = null;
      logger.info('✅ SMTP Transporter verified successfully. Ready to send emails.');
      return true;
    } catch (err: any) {
      this.isVerified = false;
      this.lastVerificationError = err.message || String(err);
      logger.error(`❌ SMTP Transporter verification failed: ${err.message}`, {
        code: err.code,
        response: err.response,
        command: err.command
      });
      return false;
    }
  }

  public async checkHealth(): Promise<{ status: string; isConfigured: boolean; isVerified: boolean; mailUser?: string; error?: string }> {
    return {
      status: this.isVerified ? 'healthy' : 'degraded',
      isConfigured: !!this.transporter,
      isVerified: this.isVerified,
      mailUser: this.mailUser ? `${this.mailUser.substring(0, 3)}***@${this.mailUser.split('@')[1]}` : undefined,
      error: this.lastVerificationError || undefined,
    };
  }

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private printDevOtpBox(email: string, otp: string): void {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 [DEV MODE OTP FALLBACK]
Recipient: ${email}
OTP Code:  ${otp}
Expires:    5 Minutes
Status:     Email delivery bypassed/failed in dev mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }

  async sendOTPEmail(email: string, otp: string): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; margin-top: 0;">Welcome to StudyHub!</h2>
        <p style="color: #374151; font-size: 16px;">Your email verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #4f46e5; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code will expire in 5 minutes.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    if (!this.transporter) {
      this.printDevOtpBox(email, otp);
      return true;
    }

    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const info = await this.transporter.sendMail({
          from: `"StudyHub" <${this.mailUser}>`,
          to: email,
          subject: 'StudyHub - Email Verification Code',
          html: htmlContent,
        });

        logger.info(`📧 OTP email successfully dispatched to ${email} (Attempt ${attempt}/${maxRetries}). MessageId: ${info.messageId}`);
        return true;
      } catch (err: any) {
        lastError = err;
        logger.warn(`⚠️ SMTP sendMail attempt ${attempt}/${maxRetries} failed for ${email}: ${err.message}`, {
          code: err.code,
          command: err.command,
          response: err.response,
        });

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // All retries failed
    logger.error(`❌ Failed to dispatch OTP email to ${email} after ${maxRetries} attempts.`, {
      error: lastError?.message,
      code: lastError?.code,
      response: lastError?.response,
    });

    if (process.env.NODE_ENV !== 'production') {
      this.printDevOtpBox(email, otp);
      return true;
    }

    return false;
  }
}

export const mailService = new MailService();
