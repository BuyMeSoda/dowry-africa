import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM       = "noreply@dowry.africa";
const HELLO_FROM = "hello@dowry.africa";

const baseStyle = `
  font-family: Georgia, 'Times New Roman', serif;
  background: #fdf8f4;
  margin: 0;
  padding: 0;
`;

const containerStyle = `
  max-width: 560px;
  margin: 40px auto;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
`;

const headerStyle = `
  background: linear-gradient(135deg, #8b2252 0%, #c43b7a 100%);
  padding: 36px 40px;
  text-align: center;
`;

const logoTextStyle = `
  color: #ffffff;
  font-size: 26px;
  font-weight: bold;
  letter-spacing: -0.5px;
  margin: 0;
`;

const bodyStyle = `
  padding: 36px 40px;
  color: #2d1a1a;
`;

const h2Style = `
  font-size: 22px;
  font-weight: bold;
  margin: 0 0 12px;
  color: #1a0a0a;
`;

const pStyle = `
  font-size: 15px;
  line-height: 1.7;
  color: #5a3a3a;
  margin: 0 0 20px;
`;

const buttonStyle = `
  display: inline-block;
  background: linear-gradient(135deg, #8b2252 0%, #c43b7a 100%);
  color: #ffffff;
  text-decoration: none;
  padding: 14px 32px;
  border-radius: 100px;
  font-size: 15px;
  font-weight: bold;
  letter-spacing: 0.3px;
`;

const footerStyle = `
  padding: 24px 40px;
  background: #fdf8f4;
  text-align: center;
  font-size: 12px;
  color: #a08080;
  border-top: 1px solid #f0e4e4;
`;

const previewBoxStyle = `
  background: #fdf0f5;
  border-left: 4px solid #c43b7a;
  border-radius: 0 8px 8px 0;
  padding: 16px 20px;
  margin: 0 0 28px;
  font-size: 15px;
  line-height: 1.6;
  color: #3a1a2a;
  font-style: italic;
`;

export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationLink: string,
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="${baseStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      <p style="${logoTextStyle}">Dowry.Africa</p>
    </div>
    <div style="${bodyStyle}">
      <h2 style="${h2Style}">Welcome, ${name}</h2>
      <p style="${pStyle}">
        We're glad you're here. Dowry.Africa is a commitment-first matchmaking platform for Africans and the diaspora — built on intentionality, cultural pride, and genuine connection.
      </p>
      <p style="${pStyle}">
        To get started, please verify your email address by clicking the button below.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verificationLink}" style="${buttonStyle}">Verify My Account</a>
      </div>
      <p style="${pStyle}">
        If you didn't create an account, you can safely ignore this email.
      </p>
      <p style="${pStyle}">This link expires in 24 hours.</p>
    </div>
    <div style="${footerStyle}">
      &copy; ${new Date().getFullYear()} Dowry.Africa &nbsp;&middot;&nbsp; Commitment-first matchmaking
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your Dowry Africa account",
    html,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetLink: string,
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="${baseStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      <p style="${logoTextStyle}">Dowry.Africa</p>
    </div>
    <div style="${bodyStyle}">
      <h2 style="${h2Style}">Password reset request</h2>
      <p style="${pStyle}">Hi ${name},</p>
      <p style="${pStyle}">
        You requested a password reset for your Dowry.Africa account. Click the button below to choose a new password.
        This link expires in <strong>1 hour</strong>.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}" style="${buttonStyle}">Reset my password &rarr;</a>
      </div>
      <p style="${pStyle}" style="font-size:13px; color:#888;">
        If you did not request this, you can safely ignore this email — your password will not change.
      </p>
    </div>
    <div style="${footerStyle}">
      &copy; ${new Date().getFullYear()} Dowry.Africa &nbsp;&middot;&nbsp; Built for marriage. Not just matches.
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your Dowry.Africa password",
    html,
  });
}

export async function sendMessageNotificationEmail(
  to: string,
  name: string,
  senderName: string,
  messagePreview: string,
): Promise<void> {
  const appLink = "https://workspacedowry-africa-production.up.railway.app/messages";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="${baseStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      <p style="${logoTextStyle}">Dowry.Africa</p>
    </div>
    <div style="${bodyStyle}">
      <h2 style="${h2Style}">Hi ${name}, you have a new message</h2>
      <p style="${pStyle}">
        <strong>${senderName}</strong> sent you a message on Dowry.Africa:
      </p>
      <div style="${previewBoxStyle}">${messagePreview}</div>
      <p style="${pStyle}">
        Open the app to read and reply — meaningful conversations start with a thoughtful response.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${appLink}" style="${buttonStyle}">Read Message</a>
      </div>
    </div>
    <div style="${footerStyle}">
      &copy; ${new Date().getFullYear()} Dowry.Africa &nbsp;&middot;&nbsp; Commitment-first matchmaking<br />
      <span style="margin-top: 8px; display: inline-block;">You're receiving this because you have notifications enabled.</span>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "You have a new message on Dowry Africa",
    html,
  });
}

// ─── Premium broadcast email builder ─────────────────────────────────────────
const FRONTEND_URL = process.env.FRONTEND_URL ?? "https://dowry.africa";

function resolveUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.startsWith("/") ? `${FRONTEND_URL}${url}` : url;
}

export function buildBroadcastHtml(opts: {
  firstName: string;
  subject: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const { firstName, subject, bodyHtml, ctaLabel, ctaUrl, footerNote } = opts;
  const resolvedUrl = resolveUrl(ctaUrl);
  const ctaBlock = ctaLabel && resolvedUrl
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 32px 0;">
        <tr><td align="center">
          <a href="${resolvedUrl}" target="_blank"
             style="display: inline-block; background-color: #8B1C3F; color: #ffffff; text-decoration: none;
                    padding: 14px 32px; border-radius: 50px; font-family: Arial, Helvetica, sans-serif;
                    font-size: 15px; font-weight: bold; letter-spacing: 0.3px; mso-padding-alt: 0;">
            ${ctaLabel}
          </a>
        </td></tr>
      </table>`
    : "";

  const footer = footerNote
    ?? "You are receiving this because you signed up at dowry.africa";

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f9f6f2; }
    table { border-collapse: collapse; }
    img { border: 0; display: block; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .body-cell { padding: 28px 24px !important; }
      .footer-cell { padding: 20px 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f9f6f2;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
         style="background-color: #f9f6f2; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- card -->
        <table class="container" width="600" cellpadding="0" cellspacing="0" border="0" role="presentation"
               style="background-color: #ffffff; border-radius: 12px;
                      box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">

          <!-- header -->
          <tr>
            <td style="background-color: #8B1C3F; padding: 36px 40px; text-align: center;">
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif;
                         color: #ffffff; font-size: 26px; font-weight: bold; letter-spacing: -0.5px;">
                Dowry.Africa
              </p>
            </td>
          </tr>

          <!-- body -->
          <tr>
            <td class="body-cell" style="padding: 36px 40px;">
              <p style="margin: 0 0 4px; font-family: Arial, Helvetica, sans-serif;
                         font-size: 15px; color: #5a3a3a;">
                Hi ${firstName},
              </p>
              ${bodyHtml}
              ${ctaBlock}
            </td>
          </tr>

          <!-- divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #f0e4e4; margin: 0;" />
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td class="footer-cell"
                style="background-color: #1a1a1a; padding: 24px 40px; text-align: center;
                       border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 6px; font-family: Arial, Helvetica, sans-serif;
                         font-size: 12px; color: #ffffff;">
                &copy; ${new Date().getFullYear()} Dowry.Africa &mdash; Built for marriage. Not just matches.
              </p>
              <p style="margin: 0; font-family: Arial, Helvetica, sans-serif;
                         font-size: 11px; color: #888888;">
                ${footer}
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

function textToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .split("\n")
    .map(line => line.trim() === "" ? "<br />" :
      `<p style="margin: 0 0 16px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.8; color: #5a3a3a;">${line}</p>`)
    .join("\n");
}

export async function sendBroadcastEmail(
  to: string,
  name: string,
  subject: string,
  body: string,
  ctaLabel?: string,
  ctaUrl?: string,
): Promise<void> {
  const firstName = (name || "").split(" ")[0] || "there";
  const personalizedBody = body.replace(/\[First Name\]/gi, firstName);
  const bodyHtml = textToHtml(personalizedBody);

  const html = buildBroadcastHtml({ firstName, subject, bodyHtml, ctaLabel, ctaUrl });

  await resend.emails.send({
    from: HELLO_FROM,
    replyTo: HELLO_FROM,
    to,
    subject,
    html,
  });
}

export async function sendAdminDirectEmail(
  to: string,
  name: string,
  subject: string,
  message: string,
): Promise<void> {
  const firstName = (name || "").split(" ")[0] || "there";
  const personalizedMessage = message.replace(/\[First Name\]/gi, firstName);
  const bodyHtml = textToHtml(personalizedMessage)
    + `<p style="margin: 24px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.8; color: #5a3a3a;">
        Warm regards,<br /><strong>The Dowry.Africa Team</strong>
       </p>`;

  const html = buildBroadcastHtml({
    firstName,
    subject,
    bodyHtml,
    footerNote: "You are receiving this message from the Dowry.Africa team.",
  });

  await resend.emails.send({
    from: HELLO_FROM,
    replyTo: HELLO_FROM,
    to,
    subject,
    html,
  });
}
