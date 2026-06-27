import sgMail from '@sendgrid/mail';
import fs from 'fs';
import path from 'path';

let SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  SENDGRID_API_KEY = SENDGRID_API_KEY.replace(/['"\s\r\n]/g, '').trim();
}

const EMAIL_FROM = (process.env.EMAIL_FROM || 'no-reply@neighborfit.app').replace(/['"\s\r\n]/g, '').trim();
const CLIENT_URL = process.env.CLIENT_URL || process.env.VITE_API_URL || 'http://localhost:5173';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const loadTemplate = (name, data = {}) => {
  const filePath = path.join(process.cwd(), 'server', 'templates', `${name}.html`);
  let tpl = fs.readFileSync(filePath, 'utf8');
  Object.keys(data).forEach((k) => {
    const re = new RegExp(`{{\s*${k}\s*}}`, 'g');
    tpl = tpl.replace(re, data[k]);
  });
  return tpl;
};

export const sendResetPasswordEmail = async (to, token) => {
  if (!SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY not configured — skipping actual email send (development)');
    return;
  }

  const resetLink = `${CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const html = loadTemplate('resetPassword', { resetLink });

  const msg = {
    to,
    from: EMAIL_FROM,
    subject: 'NeighborFit — Reset Your Password',
    html
  };

  return sgMail.send(msg);
};

export const sendVerificationOTPEmail = async (to, otp) => {
  if (!SENDGRID_API_KEY) {
    console.warn(`SENDGRID_API_KEY not configured — skipping actual email send (development). OTP is: ${otp}`);
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #4f46e5; margin-bottom: 20px; text-align: center;">Verify Your PropSync Registration</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.5;">Thank you for signing up for PropSync. Please use the following 6-digit verification code to complete your registration:</p>
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; margin: 25px 0; text-align: center; border-radius: 8px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin-top: 20px;">This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">PropSync App &copy; 2026. All rights reserved.</p>
    </div>
  `;

  const msg = {
    to,
    from: EMAIL_FROM,
    subject: 'PropSync — Registration Verification Code',
    html
  };

  return sgMail.send(msg);
};

export default { sendResetPasswordEmail, sendVerificationOTPEmail };