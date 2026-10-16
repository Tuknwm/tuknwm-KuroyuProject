const LOGO = 'https://res.cloudinary.com/ipk905bl/image/upload/f_auto,q_auto/CatLogoWhite';

function welcomeEmail({ name }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Kuroyu</title>
  <style>
    @media only screen and (max-width: 600px) {
      .outer { padding: 16px 8px !important; }
      .card  { border-radius: 12px !important; }
      .hdr   { padding: 28px 20px 24px !important; }
      .logo  { height: 44px !important; }
      .body  { padding: 28px 20px 24px !important; }
      .h1    { font-size: 20px !important; }
      .p     { font-size: 14px !important; }
      .cta-td { border-radius: 10px !important; }
      .cta-a  { padding: 14px 24px !important; font-size: 15px !important; }
      .ftr   { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" class="outer" style="background:#ffffff;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" class="card" style="max-width:520px;background:#262626;border-radius:16px;overflow:hidden;border:1px solid rgba(252,255,252,0.08);">

          <tr>
            <td class="hdr" style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid rgba(252,255,252,0.06);">
              <img src="${LOGO}" alt="Kuroyu" class="logo" style="height:56px;display:inline-block;max-width:100%;" />
            </td>
          </tr>

          <tr>
            <td class="body" style="padding:40px 40px 32px;">
              <h1 class="h1" style="margin:0 0 12px;font-size:24px;font-weight:700;color:#FCFFFC;letter-spacing:-0.3px;line-height:1.2;">
                Welcome, ${name}!
              </h1>
              <p class="p" style="margin:0 0 28px;font-size:15px;line-height:1.7;color:rgba(252,255,252,0.6);">
                Your account is ready. Start exploring our collection — Japanese streetwear designed for those who move differently.
              </p>

              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td class="cta-td" style="border-radius:10px;background:#FCFFFC;">
                    <a href="http://localhost:5173" class="cta-a"
                      style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#262626;text-decoration:none;border-radius:10px;letter-spacing:0.01em;white-space:nowrap;">
                      Shop Now →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 20px;">
              <div style="height:1px;background:rgba(252,255,252,0.06);"></div>
            </td>
          </tr>

          <tr>
            <td class="ftr" style="padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(252,255,252,0.25);line-height:1.7;">
                You received this email because you signed up for Kuroyu.<br/>
                &copy; ${new Date().getFullYear()} Kuroyu. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { welcomeEmail };
