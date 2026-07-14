import "server-only"
import nodemailer from "nodemailer"
import { env } from "@/lib/env"

// Gmail SMTP via App Password. Gracefully degrades when not configured
// (local dev): emails are logged and skipped instead of crashing flows.
const transporter =
  env.GMAIL_USER && env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: env.GMAIL_USER,
          pass: env.GMAIL_APP_PASSWORD,
        },
      })
    : null

export const isEmailConfigured = !!transporter

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  text: string
}) {
  if (!transporter) {
    console.warn(`[email] not configured — skipped "${params.subject}" to ${params.to}`)
    return
  }
  await transporter.sendMail({
    from: env.EMAIL_FROM ?? `CRM <${env.GMAIL_USER}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  })
}
