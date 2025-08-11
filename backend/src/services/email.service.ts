import nodemailer from 'nodemailer'

export interface EmailData {
  to: string
  subject: string
  html: string
}

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Go3net HR System" <${process.env.EMAIL_USER}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html
      }

      await this.transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Email sending failed:', error)
      return false
    }
  }

  async sendPasswordResetEmail(email: string, fullName: string, resetToken: string): Promise<boolean> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    
    const emailData: EmailData = {
      to: email,
      subject: 'Reset Your Password - Go3net HR Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>Hello ${fullName},</p>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin-top: 30px;">
          <p style="color: #666; font-size: 12px;">Go3net HR Management System</p>
        </div>
      `
    }

    return this.sendEmail(emailData)
  }

  async sendEmailVerificationEmail(email: string, fullName: string, verificationToken: string): Promise<boolean> {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
    
    const emailData: EmailData = {
      to: email,
      subject: 'Verify Your Email - Go3net HR Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Verify Your Email</h2>
          <p>Hello ${fullName},</p>
          <p>Please verify your email address by clicking the link below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
          </div>
          <p>This link will expire in 24 hours.</p>
          <hr style="margin-top: 30px;">
          <p style="color: #666; font-size: 12px;">Go3net HR Management System</p>
        </div>
      `
    }

    return this.sendEmail(emailData)
  }

  async sendEmployeeInvitationEmail(email: string, fullName: string, temporaryPassword: string): Promise<boolean> {
    const loginLink = `${process.env.FRONTEND_URL}/login`
    
    const emailData: EmailData = {
      to: email,
      subject: 'Welcome to Go3net HR Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to the Team!</h2>
          <p>Hello ${fullName},</p>
          <p>Your HR account has been created. Here are your login details:</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Login Now</a>
          </div>
          <p>Please change your password after your first login.</p>
          <hr style="margin-top: 30px;">
          <p style="color: #666; font-size: 12px;">Go3net HR Management System</p>
        </div>
      `
    }

    return this.sendEmail(emailData)
  }
}