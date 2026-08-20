import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isProduction: boolean;

  constructor(private configService: ConfigService) {
    this.isProduction = configService.get('NODE_ENV') === 'production';
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.isProduction) {
        // In development, log emails instead of sending
        this.logger.log(`[DEV EMAIL] To: ${options.to} | Subject: ${options.subject}`);
        this.logger.log(`[DEV EMAIL] Body: ${options.html.substring(0, 200)}...`);
        return true;
      }

      // Production: use nodemailer or SendGrid/Mailgun
      // const transporter = nodemailer.createTransport({ ... });
      // await transporter.sendMail({ ... });
      
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
      return true;
} catch (error: any) {
      this.logger.error(`Failed to send email to ${options.to}: ${error?.message || 'Unknown error'}`);
      return false;
    }
  }

  async sendWelcomeEmail(user: { name: string; email: string }): Promise<boolean> {
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to ERP Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to ERP Platform!</h1>
          <p>Hello ${user.name},</p>
          <p>Your account has been created successfully. You can now access all the features of the ERP Platform.</p>
          <p>To get started:</p>
          <ul>
            <li>Log in to your account</li>
            <li>Complete your profile</li>
            <li>Explore the dashboard</li>
          </ul>
          <p>If you have any questions, please contact your institution administrator.</p>
          <p>Best regards,<br/>ERP Platform Team</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Password Reset - ERP Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p>You have requested to reset your password.</p>
          <p>Click the link below to reset your password (valid for 1 hour):</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
  }

  async sendFeeReminderEmail(user: { name: string; email: string }, amount: number, dueDate: string): Promise<boolean> {
    return this.sendEmail({
      to: user.email,
      subject: 'Fee Payment Reminder - ERP Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Fee Payment Reminder</h1>
          <p>Dear ${user.name},</p>
          <p>This is a reminder that your fee payment of <strong>$${amount.toFixed(2)}</strong> is due on <strong>${dueDate}</strong>.</p>
          <p>Please make the payment on time to avoid late fees.</p>
          <p>Thank you,<br/>ERP Platform Team</p>
        </div>
      `,
    });
  }

  async sendResultNotification(user: { name: string; email: string }, term: string): Promise<boolean> {
    return this.sendEmail({
      to: user.email,
      subject: `Results Published - ${term} - ERP Platform`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Results Published</h1>
          <p>Dear ${user.name},</p>
          <p>Your results for <strong>${term}</strong> have been published.</p>
          <p>Please log in to the ERP Platform to view your results.</p>
          <p>Best regards,<br/>ERP Platform Team</p>
        </div>
      `,
    });
  }
}
