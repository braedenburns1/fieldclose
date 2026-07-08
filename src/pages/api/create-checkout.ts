import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, plan } = req.body

  const isLifetime = plan === 'lifetime'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: isLifetime ? 'payment' : 'subscription',
    customer_email: email,
    line_items: [{
      price: isLifetime
        ? process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
      quantity: 1,
    }],
    success_url: `${req.headers.origin}/dashboard?subscribed=true`,
    cancel_url: `${req.headers.origin}/billing`,
  })

  res.status(200).json({ url: session.url })
}
