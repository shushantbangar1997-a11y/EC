import { Resend } from 'resend'
import { buildWelcomeEmail } from './emailTemplates/welcome.js'
import { buildQuoteConfirmationEmail } from './emailTemplates/quoteConfirmation.js'

const BASE_URL = process.env.BASE_URL || 'https://everywherecars.com'
const FROM_EMAIL = process.env.FROM_EMAIL || 'Everywhere Cars <booking@everywherecars.com>'

async function getResendClient() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null

  if (hostname && xReplitToken) {
    try {
      const data = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
        {
          headers: {
            Accept: 'application/json',
            'X-Replit-Token': xReplitToken,
          },
        }
      ).then(r => r.json()).then(d => d.items?.[0])

      if (data?.settings?.api_key) {
        const fromEmail = data.settings.from_email || FROM_EMAIL
        return { client: new Resend(data.settings.api_key), fromEmail }
      }
    } catch (err) {
      console.warn('[email] Could not fetch Resend credentials via connector:', err.message)
    }
  }

  if (process.env.RESEND_API_KEY) {
    return { client: new Resend(process.env.RESEND_API_KEY), fromEmail: FROM_EMAIL }
  }

  return null
}

export async function sendWelcomeEmail(name, email) {
  if (!email) return
  const resend = await getResendClient()
  if (!resend) {
    console.warn('[email] Resend not configured — skipping welcome email to', email)
    return
  }
  const { subject, html } = buildWelcomeEmail(name || 'there', BASE_URL)
  const result = await resend.client.emails.send({
    from: resend.fromEmail,
    to: email,
    subject,
    html,
  })
  console.log('[email] Welcome email sent to', email, result?.data?.id || '')
}

export async function sendQuoteConfirmation(name, email, pickup, dropoff, vehicleType) {
  if (!email) return
  const resend = await getResendClient()
  if (!resend) {
    console.warn('[email] Resend not configured — skipping quote confirmation to', email)
    return
  }
  const { subject, html } = buildQuoteConfirmationEmail(name || 'there', pickup, dropoff, vehicleType, BASE_URL)
  const result = await resend.client.emails.send({
    from: resend.fromEmail,
    to: email,
    subject,
    html,
  })
  console.log('[email] Quote confirmation sent to', email, result?.data?.id || '')
}
