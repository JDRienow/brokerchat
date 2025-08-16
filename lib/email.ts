import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  brokerName: string,
) {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email send');
    return { message: 'Email service not configured' };
  }

  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      to: [email],
      subject: 'Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">Password Reset Request</h1>
            <p>Hi ${brokerName},</p>
            <p>We received a request to reset your password for your account. If you didn't make this request, you can safely ignore this email.</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; border: 1px solid #e1e8ed; margin-bottom: 30px;">
            <p style="margin-bottom: 25px;">To reset your password, click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 14px; color: #666; border-top: 1px solid #e1e8ed; padding-top: 20px; margin-top: 30px;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>Security Notice:</strong> This reset link will expire in 1 hour for your security. 
              If you need to reset your password after it expires, please request a new reset link.
            </p>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e1e8ed; padding-top: 20px;">
            <p>This email was sent from your commercial real estate platform.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email');
    }

    console.log('Password reset email sent:', data);
    return data;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

export async function sendTeamInvitationEmail(
  invitedEmail: string,
  invitationToken: string,
  adminEmail: string,
) {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email send');
    return { message: 'Email service not configured' };
  }

  const acceptUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/team/accept?token=${invitationToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'support@om2chat.com',
      to: [invitedEmail],
      subject: "You've been invited to join a team on OM2Chat",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Team Invitation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">Team Invitation</h1>
            <p>Hello!</p>
            <p><strong>${adminEmail}</strong> has invited you to join their team on OM2Chat, our commercial real estate platform.</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; border: 1px solid #e1e8ed; margin-bottom: 30px;">
            <p style="margin-bottom: 25px;">As a team member, you'll be able to:</p>
            <ul style="margin-bottom: 25px; padding-left: 20px;">
              <li>Access shared documents and analytics</li>
              <li>Collaborate with your team members</li>
              <li>View team-wide insights and reports</li>
              <li>Work together on client presentations</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${acceptUrl}" 
                 style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            <p style="font-size: 14px; color: #666; border-top: 1px solid #e1e8ed; padding-top: 20px; margin-top: 30px;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${acceptUrl}" style="color: #3b82f6; word-break: break-all;">${acceptUrl}</a>
            </p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>Important:</strong> This invitation will expire in 7 days. 
              You'll need to create an account and set up your password when you accept the invitation.
            </p>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e1e8ed; padding-top: 20px;">
            <p>This invitation was sent from OM2Chat, your commercial real estate platform.</p>
            <p>If you have any questions, please contact our support team at support@om2chat.com.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email');
    }

    console.log('Team invitation email sent:', data);
    return data;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}
