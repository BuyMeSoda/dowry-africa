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

export async function sendBroadcastEmail(
  to: string,
  name: string,
  subject: string,
  body: string,
  ctaLabel?: string,
  ctaUrl?: string,
): Promise<void> {
  const greeting = name ? `Hi ${name},` : "Hello,";
  const ctaBlock = ctaLabel && ctaUrl
    ? `<div style="text-align: center; margin: 32px 0;">
        <a href="${ctaUrl}" style="${buttonStyle}">${ctaLabel}</a>
       </div>`
    : "";

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
      <p style="${pStyle}">${greeting}</p>
      <h2 style="${h2Style}">${subject}</h2>
      <div style="font-size: 15px; line-height: 1.8; color: #5a3a3a; margin: 0 0 24px; white-space: pre-wrap;">${body}</div>
      ${ctaBlock}
    </div>
    <div style="${footerStyle}">
      &copy; ${new Date().getFullYear()} Dowry.Africa &mdash; Built for marriage. Not just matches.<br />
      <span style="margin-top: 8px; display: inline-block;">
        You're receiving this because you signed up at dowry.africa
      </span>
    </div>
  </div>
</body>
</html>`;

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
      <p style="${pStyle}">Hi ${name},</p>
      <div style="font-size: 15px; line-height: 1.8; color: #5a3a3a; margin: 0 0 24px; white-space: pre-wrap;">${message}</div>
      <p style="${pStyle}">Warm regards,<br /><strong>The Dowry.Africa Team</strong></p>
    </div>
    <div style="${footerStyle}">
      &copy; ${new Date().getFullYear()} Dowry.Africa &mdash; Built for marriage. Not just matches.
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: HELLO_FROM,
    replyTo: HELLO_FROM,
    to,
    subject,
    html,
  });
}
