// mail.service.ts
import * as nodemailer from 'nodemailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('EMAIL_HOST'),
      port: this.configService.getOrThrow<string>('EMAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.getOrThrow<string>('EMAIL_USER'),
        pass: this.configService.getOrThrow<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    //frontend link to reset password
    const resetLink = `${this.configService.getOrThrow<string>('FRONTEND_URL')}/auth/reset-password?resetToken=${token}`;
    const mailOptions = {
      from: 'Auth-backend service',
      to: to,
      subject: 'Password Reset Request',
      html: `<!DOCTYPE html>
            <html>
              <body style="font-family: Arial, sans-serif; color: #333;">
                <table style="width: 100%;">
                  <tr>
                    <td>
                      <!-- Logo -->
                      <img src="https://res.cloudinary.com/duxvid3cd/image/upload/v1747075306/WATCHMATCH_jmuyp8.png" alt="WatchMatch Logo" style="max-width: 100px;">
                    </td>
                  </tr>
                </table>
                <h2>Password Reset Request</h2>
                <p>Hello,</p>
                <p>We received a request to reset the password for your account on <strong>WatchMatch</strong>.</p>
                <p style="margin-top: 50px">To reset your password, please click the button below:</p>
                <p>
                  <a href=${resetLink} style="background-color: #34d399; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                </p>
                <p style="margin-top: 50px">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
                <p>Thank you,<br/>The WatchMatch Team</p>
              </body>
            </html>`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Password reset email sent to ${to} [Message ID: ${info.messageId}]`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${to}`,
        error.stack,
      );
      throw error;
    }
  }
}
