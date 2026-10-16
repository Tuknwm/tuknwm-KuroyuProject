const nodemailer = require('nodemailer');
const { welcomeEmail } = require('../emails/welcome');
const { deleteAccountEmail } = require('../emails/deleteAccount');

function getTransport() {
  const { GMAIL_USER, GMAIL_PASS } = process.env;
  if (!GMAIL_USER || !GMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });
}

async function sendWelcome({ name, email }) {
  const transport = getTransport();
  if (!transport) return;
  try {
    await transport.sendMail({
      from: `Kuroyu <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Welcome to Kuroyu, ${name}!`,
      html: welcomeEmail({ name }),
    });
  } catch (err) {
    console.error('[mailer] sendWelcome failed:', err.message);
  }
}

const LOGO = 'https://res.cloudinary.com/ipk905bl/image/upload/f_auto,q_auto/CatLogoWhite';

async function sendResetPassword({ name, email, resetUrl }) {
  const transport = getTransport();
  if (!transport) return;
  try {
    await transport.sendMail({
      from: `Kuroyu <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Reset your Kuroyu password',
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Reset Password</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#262626;border-radius:16px;overflow:hidden;border:1px solid rgba(252,255,252,0.08);">
        <tr>
          <td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid rgba(252,255,252,0.06);">
            <img src="${LOGO}" alt="Kuroyu" style="height:56px;display:inline-block;max-width:100%;" />
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#FCFFFC;letter-spacing:-0.3px;line-height:1.2;">Reset your password</h1>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:rgba(252,255,252,0.6);">
              Hi ${name}, click the button below to set a new password. This link expires in <strong style="color:#FCFFFC;">1 hour</strong>.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:10px;background:#FCFFFC;">
                  <a href="${resetUrl}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#262626;text-decoration:none;border-radius:10px;white-space:nowrap;">
                    Reset Password →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:0 20px;"><div style="height:1px;background:rgba(252,255,252,0.06);"></div></td></tr>
        <tr>
          <td style="padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:rgba(252,255,252,0.25);line-height:1.7;">
              If you didn't request this, you can safely ignore this email.<br/>
              &copy; ${new Date().getFullYear()} Kuroyu. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
  } catch (err) {
    console.error('[mailer] sendResetPassword failed:', err.message);
  }
}

async function sendDeleteAccount({ name, email, cancelUrl }) {
  const transport = getTransport();
  if (!transport) return;
  try {
    await transport.sendMail({
      from: `Kuroyu <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your Kuroyu account is scheduled for deletion',
      html: deleteAccountEmail({ name, cancelUrl }),
    });
  } catch (err) {
    console.error('[mailer] sendDeleteAccount failed:', err.message);
  }
}

module.exports = { sendWelcome, sendResetPassword, sendDeleteAccount };
