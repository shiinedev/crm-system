import "server-only"

type EmailContent = { subject: string; html: string; text: string }

const BRAND = "CRM"

/** Shared table-based layout — email clients need inline styles. */
function layout(params: { preheader: string; title: string; bodyHtml: string }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <span style="display:none;max-height:0;overflow:hidden;">${params.preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;border:1px solid #e4e4e7;">
            <tr>
              <td style="padding:32px 32px 0;">
                <div style="width:40px;height:40px;background-color:#18181b;border-radius:10px;text-align:center;line-height:40px;">
                  <span style="color:#ffffff;font-size:18px;font-weight:bold;">↑</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0;">
                <h1 style="margin:0;font-size:20px;line-height:28px;color:#18181b;">${params.title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 32px;font-size:14px;line-height:22px;color:#3f3f46;">
                ${params.bodyHtml}
              </td>
            </tr>
          </table>
          <p style="max-width:480px;margin:16px auto 0;font-size:12px;line-height:18px;color:#a1a1aa;text-align:center;">
            You received this email because of an account action on ${BRAND}.
            If this wasn't you, you can safely ignore it.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function button(url: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:#18181b;border-radius:8px;">
        <a href="${url}" target="_blank" style="display:inline-block;padding:10px 24px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>
  <p style="margin:0;font-size:12px;color:#71717a;word-break:break-all;">
    Or copy this link into your browser:<br/>
    <a href="${url}" style="color:#71717a;">${url}</a>
  </p>`
}

export function resetPasswordEmail(params: { name?: string | null; url: string }): EmailContent {
  const greeting = params.name ? `Hi ${params.name},` : "Hi,"
  return {
    subject: `Reset your ${BRAND} password`,
    html: layout({
      preheader: "Reset your password — this link expires soon.",
      title: "Reset your password",
      bodyHtml: `
        <p style="margin:0 0 8px;">${greeting}</p>
        <p style="margin:0;">We received a request to reset the password for your account.
        Click the button below to choose a new one. This link expires in 1 hour.</p>
        ${button(params.url, "Reset password")}`,
    }),
    text: `${greeting}\n\nWe received a request to reset your ${BRAND} password. Open this link to choose a new one (expires in 1 hour):\n\n${params.url}\n\nIf this wasn't you, you can safely ignore this email.`,
  }
}

export function verifyEmailEmail(params: { name?: string | null; url: string }): EmailContent {
  const greeting = params.name ? `Hi ${params.name},` : "Hi,"
  return {
    subject: `Verify your email for ${BRAND}`,
    html: layout({
      preheader: "Confirm your email address to finish setting up your account.",
      title: "Verify your email",
      bodyHtml: `
        <p style="margin:0 0 8px;">${greeting}</p>
        <p style="margin:0;">Welcome to ${BRAND}! Please confirm this email address belongs to you.</p>
        ${button(params.url, "Verify email")}`,
    }),
    text: `${greeting}\n\nWelcome to ${BRAND}! Confirm your email address by opening this link:\n\n${params.url}\n\nIf this wasn't you, you can safely ignore this email.`,
  }
}

export function invitationEmail(params: {
  inviterName?: string | null
  organizationName: string
  role: string
  url: string
}): EmailContent {
  const inviter = params.inviterName ?? "A teammate"
  const role = params.role.replace("_", " ")
  return {
    subject: `You've been invited to ${params.organizationName} on ${BRAND}`,
    html: layout({
      preheader: `${inviter} invited you to join ${params.organizationName}.`,
      title: `Join ${params.organizationName}`,
      bodyHtml: `
        <p style="margin:0;">${inviter} invited you to join
        <strong>${params.organizationName}</strong> on ${BRAND} as
        <strong>${role}</strong>. Accept the invitation to start collaborating.</p>
        ${button(params.url, "Accept invitation")}`,
    }),
    text: `${inviter} invited you to join ${params.organizationName} on ${BRAND} as ${role}.\n\nAccept the invitation:\n\n${params.url}\n\nIf you weren't expecting this, you can safely ignore this email.`,
  }
}
