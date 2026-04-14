import nodemailer from 'nodemailer'
import { buildWelcomeEmail } from './emailTemplates/welcome.js'
import { buildQuoteConfirmationEmail } from './emailTemplates/quoteConfirmation.js'

const BASE_URL = process.env.BASE_URL || 'https://everywherecars.com'

function createGmailTransport() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) return null
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
}

export async function sendWelcomeEmail(name, email) {
  if (!email) return
  const transport = createGmailTransport()
  if (!transport) {
    console.warn('[email] GMAIL_USER / GMAIL_APP_PASSWORD not set — skipping welcome email')
    return
  }
  const { subject, html } = buildWelcomeEmail(name || 'there', BASE_URL)
  const info = await transport.sendMail({
    from: `"Everywhere Cars" <${process.env.GMAIL_USER}>`,
    to: email,
    subject,
    html,
  })
  console.log('[email] Welcome email sent to', email, info.messageId)
}

export async function sendQuoteConfirmation(name, email, pickup, dropoff, vehicleType) {
  if (!email) return
  const transport = createGmailTransport()
  if (!transport) {
    console.warn('[email] GMAIL_USER / GMAIL_APP_PASSWORD not set — skipping quote confirmation')
    return
  }
  const { subject, html } = buildQuoteConfirmationEmail(name || 'there', pickup, dropoff, vehicleType, BASE_URL)
  const info = await transport.sendMail({
    from: `"Everywhere Cars" <${process.env.GMAIL_USER}>`,
    to: email,
    subject,
    html,
  })
  console.log('[email] Quote confirmation sent to', email, info.messageId)
}
