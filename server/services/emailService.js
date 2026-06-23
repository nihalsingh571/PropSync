import sgMail from '@sendgrid/mail';
import fs from 'fs';
import path from 'path';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@neighborfit.app';
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

export default { sendResetPasswordEmail };