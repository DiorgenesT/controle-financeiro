import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
    appInfo: {
        name: 'Tudo Em Dia',
        version: '0.1.0'
    }
});
