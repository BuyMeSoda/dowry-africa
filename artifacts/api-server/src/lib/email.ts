import { Resend } from "resend";
import { randomUUID } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM        = "noreply@dowry.africa";
const HELLO_FROM  = "hello@dowry.africa";
const REPLY_TO    = "hello@dowry.africa";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "https://dowry.africa";
const ADDRESS     = "Dowry.Africa | London, United Kingdom";
const YEAR        = new Date().getFullYear();

// ─── Shared style tokens ──────────────────────────────────────────────────────

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

// ─── Footer helpers ───────────────────────────────────────────────────────────

function unsubscribeUrl(email: string): string {
  return `${FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
}

function transactionalFooterHtml(email: string): string {
  return `
    <div style="padding: 20px 40px; background: #fdf8f4; text-align: center;
                font-size: 12px; color: #a08080; border-top: 1px solid #f0e4e4;">
      &copy; ${YEAR} Dowry.Africa &nbsp;&middot;&nbsp; Built for marriage. Not just matches.<br />
      <span style="display: inline-block; margin-top: 4px;">${ADDRESS}</span><br />
      <span style="display: inline-block; margin-top: 4px;">
        You received this email because you have an account on Dowry.Africa.&nbsp;
        <a href="${unsubscribeUrl(email)}" style="color: #a08080;">Unsubscribe</a>
      </span>
    </div>`;
}

function transactionalFooterText(email: string): string {
  return `---
${ADDRESS}
You received this email because you have an account on Dowry.Africa.
Unsubscribe: ${unsubscribeUrl(email)}`;
}

function marketingFooterHtml(email: string, footerNote?: string): string {
  const note = footerNote ?? "You received this because you signed up at dowry.africa";
  return `
    <td class="footer-cell"
        style="background-color: #1a1a1a; padding: 24px 40px; text-align: center;
               border-radius: 0 0 12px 12px;">
      <p style="margin: 0 0 4px; font-family: Arial, Helvetica, sans-serif;
                 font-size: 12px; color: #ffffff;">
        &copy; ${YEAR} Dowry.Africa &mdash; Built for marriage. Not just matches.
      </p>
      <p style="margin: 0 0 4px; font-family: Arial, Helvetica, sans-serif;
                 font-size: 11px; color: #888888;">
        ${ADDRESS}
      </p>
      <p style="margin: 0; font-family: Arial, Helvetica, sans-serif;
                 font-size: 11px; color: #888888;">
        ${note} &nbsp;&middot;&nbsp;
        <a href="${unsubscribeUrl(email)}" style="color: #aaaaaa; text-decoration: underline;">Unsubscribe</a>
      </p>
    </td>`;
}

function marketingFooterText(email: string, footerNote?: string): string {
  const note = footerNote ?? "You received this because you signed up at dowry.africa";
  return `---
${ADDRESS}
${note}
Unsubscribe: ${unsubscribeUrl(email)}`;
}

// ─── Standard resend call wrapper ─────────────────────────────────────────────

function emailHeaders() {
  return { "X-Entity-Ref-ID": randomUUID() };
}

// ─── Transactional emails ─────────────────────────────────────────────────────

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
        To get started, please verify your email address. This link expires in 24 hours.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verificationLink}" style="${buttonStyle}">Verify My Account</a>
      </div>
      <p style="${pStyle}">If you didn't create an account, you can safely ignore this email.</p>
    </div>
    ${transactionalFooterHtml(to)}
  </div>
</body>
</html>`;

  const text = `Welcome to Dowry.Africa, ${name}!

We're glad you're here. To get started, please verify your email address by visiting the link below. This link expires in 24 hours.

Verify your account: ${verificationLink}

If you didn't create an account, you can safely ignore this email.

${transactionalFooterText(to)}`;

  await resend.emails.send({
    from: FROM,
    to,
    reply_to: REPLY_TO,
    subject: "Verify your Dowry Africa account",
    html,
    text,
    headers: emailHeaders(),
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
      <p style="${pStyle}">If you did not request this, you can safely ignore this email — your password will not change.</p>
    </div>
    ${transactionalFooterHtml(to)}
  </div>
</body>
</html>`;

  const text = `Hi ${name},

You requested a password reset for your Dowry.Africa account. Visit the link below to choose a new password. This link expires in 1 hour.

Reset your password: ${resetLink}

If you did not request this, you can safely ignore this email — your password will not change.

${transactionalFooterText(to)}`;

  await resend.emails.send({
    from: FROM,
    to,
    reply_to: REPLY_TO,
    subject: "Reset your Dowry.Africa password",
    html,
    text,
    headers: emailHeaders(),
  });
}

export async function sendAdminWelcomeEmail(
  to: string,
  name: string,
  tempPassword: string,
  loginUrl: string,
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
      <h2 style="${h2Style}">Admin access granted</h2>
      <p style="${pStyle}">Hi ${name},</p>
      <p style="${pStyle}">
        You have been granted admin access to the <strong>Dowry.Africa</strong> platform. Here are your login credentials:
      </p>
      <div style="${previewBoxStyle}">
        <strong>Email:</strong> ${to}<br />
        <strong>Temporary password:</strong> ${tempPassword}
      </div>
      <p style="${pStyle}">Please log in and change your password immediately.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" style="${buttonStyle}">Log in to Admin Panel &rarr;</a>
      </div>
    </div>
    ${transactionalFooterHtml(to)}
  </div>
</body>
</html>`;

  const text = `Hi ${name},

You have been granted admin access to the Dowry.Africa platform.

Email: ${to}
Temporary password: ${tempPassword}

Please log in and change your password immediately.

Admin panel: ${loginUrl}

If you did not expect this email, please contact hello@dowry.africa immediately.

${transactionalFooterText(to)}`;

  await resend.emails.send({
    from: FROM,
    to,
    reply_to: REPLY_TO,
    subject: "You have been granted admin access to Dowry.Africa",
    html,
    text,
    headers: emailHeaders(),
  });
}

export async function sendAdminPasswordResetEmail(
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
      <h2 style="${h2Style}">Admin password reset</h2>
      <p style="${pStyle}">Hi ${name},</p>
      <p style="${pStyle}">
        You requested a password reset for your Dowry.Africa admin account. Click below to set a new password. This link expires in <strong>1 hour</strong>.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}" style="${buttonStyle}">Reset admin password &rarr;</a>
      </div>
      <p style="${pStyle}">If you did not request this, ignore this email — your password will not change.</p>
    </div>
    ${transactionalFooterHtml(to)}
  </div>
</body>
</html>`;

  const text = `Hi ${name},

You requested a password reset for your Dowry.Africa admin account. Visit the link below to set a new password. This link expires in 1 hour.

Reset admin password: ${resetLink}

If you did not request this, ignore this email — your password will not change.

${transactionalFooterText(to)}`;

  await resend.emails.send({
    from: FROM,
    to,
    reply_to: REPLY_TO,
    subject: "Reset your Dowry.Africa admin password",
    html,
    text,
    headers: emailHeaders(),
  });
}

export async function sendMessageNotificationEmail(
  to: string,
  name: string,
  senderName: string,
  messagePreview: string,
): Promise<void> {
  const appLink = `${FRONTEND_URL}/messages`;

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
      <p style="${pStyle}">Open the app to read and reply — meaningful conversations start with a thoughtful response.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${appLink}" style="${buttonStyle}">Read Message</a>
      </div>
    </div>
    ${transactionalFooterHtml(to)}
  </div>
</body>
</html>`;

  const text = `Hi ${name},

${senderName} sent you a message on Dowry.Africa:

"${messagePreview}"

Open the app to read and reply: ${appLink}

${transactionalFooterText(to)}`;

  await resend.emails.send({
    from: FROM,
    to,
    reply_to: REPLY_TO,
    subject: "You have a new message on Dowry Africa",
    html,
    text,
    headers: emailHeaders(),
  });
}

// ─── Broadcast / marketing email builder ──────────────────────────────────────

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
  email?: string;
}): string {
  const { firstName, subject, bodyHtml, ctaLabel, ctaUrl, footerNote, email = "" } = opts;
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
        <table class="container" width="600" cellpadding="0" cellspacing="0" border="0" role="presentation"
               style="background-color: #ffffff; border-radius: 12px;
                      box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          <tr>
            <td style="background-color: #8B1C3F; padding: 36px 40px; text-align: center;">
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif;
                         color: #ffffff; font-size: 26px; font-weight: bold; letter-spacing: -0.5px;">
                Dowry.Africa
              </p>
            </td>
          </tr>
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
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #f0e4e4; margin: 0;" />
            </td>
          </tr>
          <tr>
            ${marketingFooterHtml(email, footerNote)}
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildBroadcastText(opts: {
  firstName: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
  email: string;
}): string {
  const { firstName, body, ctaLabel, ctaUrl, footerNote, email } = opts;
  const resolvedUrl = resolveUrl(ctaUrl);
  const ctaLine = ctaLabel && resolvedUrl ? `\n${ctaLabel}: ${resolvedUrl}\n` : "";
  return `Hi ${firstName},

${body}${ctaLine}

${marketingFooterText(email, footerNote)}`;
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

  const html = buildBroadcastHtml({ firstName, subject, bodyHtml, ctaLabel, ctaUrl, email: to });
  const text = buildBroadcastText({ firstName, body: personalizedBody, ctaLabel, ctaUrl, email: to });

  await resend.emails.send({
    from: HELLO_FROM,
    to,
    reply_to: REPLY_TO,
    subject,
    html,
    text,
    headers: emailHeaders(),
  });
}

export async function sendApprovalEmail(
  to: string,
  name: string,
): Promise<void> {
  const firstName = name.split(" ")[0] || name;
  const profileLink = `${FRONTEND_URL}/profile`;

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
      <h2 style="${h2Style}">You're in. Welcome to Dowry.Africa.</h2>
      <p style="${pStyle}">Hi ${firstName},</p>
      <p style="${pStyle}">
        Your application to Dowry.Africa has been approved. Welcome to a community of Africans and diaspora who are serious about commitment, marriage, and building something real.
      </p>
      <p style="${pStyle}">Your account is now active. Complete your profile to start getting matches.</p>
      <div style="margin: 28px 0 24px;">
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; align-items:flex-start; gap:12px; padding:14px 16px; background:#fdf0f5; border-radius:12px;">
            <span style="font-size:18px; flex-shrink:0;">1.</span>
            <div><strong style="color:#1a0a0a;">Complete your profile</strong> — add your photo and bio</div>
          </div>
          <div style="display:flex; align-items:flex-start; gap:12px; padding:14px 16px; background:#fdf0f5; border-radius:12px;">
            <span style="font-size:18px; flex-shrink:0;">2.</span>
            <div><strong style="color:#1a0a0a;">Set your preferences</strong> — tell us what you are looking for</div>
          </div>
          <div style="display:flex; align-items:flex-start; gap:12px; padding:14px 16px; background:#fdf0f5; border-radius:12px;">
            <span style="font-size:18px; flex-shrink:0;">3.</span>
            <div><strong style="color:#1a0a0a;">Start discovering</strong> — browse profiles matched to your values</div>
          </div>
        </div>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${profileLink}" style="${buttonStyle}">Complete my profile &rarr;</a>
      </div>
      <p style="${pStyle}">We are so glad you are here.</p>
      <p style="${pStyle}">Warm regards,<br /><strong>The Dowry.Africa Team</strong></p>
    </div>
    ${transactionalFooterHtml(to)}
  </div>
</body>
</html>`;

  const text = `Hi ${firstName},

You're approved — welcome to Dowry.Africa!

Your application to Dowry.Africa has been approved. Welcome to a community of Africans and diaspora who are serious about commitment, marriage, and building something real.

Your account is now active. Here's how to get started:

1. Complete your profile — add your photo and bio
2. Set your preferences — tell us what you are looking for
3. Start discovering — browse profiles matched to your values

Complete your profile: ${profileLink}

We are so glad you are here.

Warm regards,
The Dowry.Africa Team

${transactionalFooterText(to)}`;

  await resend.emails.send({
    from: FROM,
    to,
    reply_to: REPLY_TO,
    subject: "You're approved — welcome to Dowry.Africa 🎉",
    html,
    text,
    headers: emailHeaders(),
  });
}

export async function sendRejectionEmail(
  to: string,
  name: string,
  rejectionReason?: string | null,
): Promise<void> {
  const firstName = name.split(" ")[0] || name;
  const reasonBlock = rejectionReason
    ? `<div style="${previewBoxStyle}">${rejectionReason}</div>`
    : "";
  const reasonText = rejectionReason ? `\n${rejectionReason}\n` : "";

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
      <h2 style="${h2Style}">Your Dowry.Africa application</h2>
      <p style="${pStyle}">Hi ${firstName},</p>
      <p style="${pStyle}">
        Thank you for your interest in Dowry.Africa.
      </p>
      <p style="${pStyle}">
        After careful review, we are unable to approve your application at this time.
      </p>
      ${reasonBlock}
      <p style="${pStyle}">
        If you believe this is an error or would like more information, please contact us at <a href="mailto:hello@dowry.africa" style="color:#c43b7a;">hello@dowry.africa</a>.
      </p>
      <p style="${pStyle}">We wish you well on your journey.</p>
      <p style="${pStyle}">Warm regards,<br /><strong>The Dowry.Africa Team</strong></p>
    </div>
    ${transactionalFooterHtml(to)}
  </div>
</body>
</html>`;

  const text = `Hi ${firstName},

Thank you for your interest in Dowry.Africa.

After careful review, we are unable to approve your application at this time.
${reasonText}
If you believe this is an error or would like more information, please contact us at hello@dowry.africa.

We wish you well on your journey.

Warm regards,
The Dowry.Africa Team

${transactionalFooterText(to)}`;

  await resend.emails.send({
    from: FROM,
    to,
    reply_to: REPLY_TO,
    subject: "Your Dowry.Africa application",
    html,
    text,
    headers: emailHeaders(),
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
    email: to,
  });

  const text = buildBroadcastText({
    firstName,
    body: personalizedMessage + "\n\nWarm regards,\nThe Dowry.Africa Team",
    footerNote: "You are receiving this message from the Dowry.Africa team.",
    email: to,
  });

  await resend.emails.send({
    from: HELLO_FROM,
    to,
    reply_to: REPLY_TO,
    subject,
    html,
    text,
    headers: emailHeaders(),
  });
}
