export function isStripeEnabled() {
  const sk = process.env.STRIPE_SECRET_KEY
  return !!(sk && sk.trim())
}

export function getStripeConfig() {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  }
}
