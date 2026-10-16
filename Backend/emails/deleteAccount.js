const LOGO = 'https://res.cloudinary.com/ipk905bl/image/upload/f_auto,q_auto/CatLogoWhite';

function deleteAccountEmail({ name, cancelUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Account Deletion Scheduled</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#262626;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid rgba(252,255,252,0.06);">
            <img src="${LOGO}" alt="Kuroyu" style="height:56px;display:inline-block;max-width:100%;" />
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#FCFFFC;letter-spacing:-0.3px;line-height:1.2;">Your account will be deleted</h1>
            <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:rgba(252,255,252,0.6);">
              Hi ${name}, we received a request to permanently delete your Kuroyu account and all associated data.
            </p>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:rgba(252,255,252,0.6);">
              Your account will be deleted in <strong style="color:#FCFFFC;">24 hours</strong>. If you changed your mind, simply log back in or click the button below to keep your account.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:10px;background:#FCFFFC;">
                  <a href="${cancelUrl}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#262626;text-decoration:none;border-radius:10px;white-space:nowrap;">
                    Keep my account →
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
              If you did not request this, please log in immediately to cancel the deletion.<br/>
              &copy; ${new Date().getFullYear()} Kuroyu. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = { deleteAccountEmail };
