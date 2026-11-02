import nodemailer from 'nodemailer';

/**
 * Creates a Nodemailer transport instance if SMTP credentials are provided.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends a 6-digit OTP email for administrative password reset.
 * Falls back safely to terminal logging in local development if SMTP is not yet configured.
 */
export async function sendAdminPasswordResetOtp({ to, otp, adminName = 'Administrator' }) {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || `"Amoga Luxury Atelier" <${process.env.SMTP_USER || 'no-reply@amoga.com'}>`;

  if (!transporter) {
    console.log('\n========================================================================');
    console.log('🔑 [AMOGA SECURITY - ADMIN PASSWORD RESET OTP (DEV MODE)]');
    console.log(`Recipient:   ${to} (${adminName})`);
    console.log(`OTP Code:    >>> ${otp} <<<`);
    console.log('Validity:    10 minutes');
    console.log('Notice:      Configure SMTP_USER and SMTP_PASS in server/.env for live Gmail delivery.');
    console.log('========================================================================\n');

    return {
      sent: false,
      devMode: true,
      devOtp: otp,
      message: 'SMTP credentials not configured. OTP logged to server terminal for local development.',
    };
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Amoga Atelier - Master Password Reset OTP</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F0; margin: 0; padding: 24px; color: #292820; }
        .container { max-width: 540px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E0D5; border-radius: 12px; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .brand { text-align: center; margin-bottom: 24px; }
        .brand-title { font-size: 20px; font-weight: 700; letter-spacing: 2px; color: #722F37; margin: 0; }
        .brand-sub { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #B08A4D; margin-top: 4px; }
        .divider { border-top: 1px solid #ECE7DE; margin: 20px 0; }
        .greeting { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
        .content { font-size: 13px; line-height: 1.6; color: #4A423B; margin-bottom: 24px; }
        .otp-box { background-color: #FAF8F5; border: 1.5px dashed #B08A4D; border-radius: 8px; text-align: center; padding: 18px; margin: 24px 0; }
        .otp-code { font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #722F37; }
        .warning { font-size: 12px; color: #8C8377; margin-top: 16px; border-left: 3px solid #B08A4D; padding-left: 12px; }
        .footer { font-size: 11px; color: #A0988A; text-align: center; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">
          <h1 class="brand-title">AMOGA ATELIER</h1>
          <div class="brand-sub">Staff Administration Portal</div>
        </div>
        <div class="divider"></div>
        <div class="greeting">Hello ${adminName},</div>
        <div class="content">
          A request was initiated to reset your Master Password for the Amoga Staff Administration Atelier.
          Use the single-use 6-digit verification code below to authorize this password change:
        </div>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        <div class="warning">
          <strong>Security Notice:</strong> This code is valid for <strong>10 minutes</strong> and can only be used once. If you did not request this password reset, please contact your systems administrator immediately.
        </div>
        <div class="footer">
          Amoga Luxury Atelier • Confidential Internal Security Dispatch
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from,
    to,
    subject: `[Amoga Atelier] ${otp} is your Admin Password Reset Code`,
    text: `Your Amoga Atelier Master Password Reset Code is: ${otp}\n\nThis code is valid for 10 minutes. If you did not request this reset, please ignore this email.`,
    html,
  });

  return {
    sent: true,
    messageId: info.messageId,
    message: 'OTP sent successfully to registered administrator email.',
  };
}

