import Stripe from 'stripe';
import prisma from '../utils/prisma';

// Initialize Stripe Client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key', {
    apiVersion: '2026-01-28.clover' as any,
});

const PRICE_PER_INTERVIEW = 1000; // $10.00
const INTERVIEW_CREDITS_PER_PURCHASE = 5;

export class StripeService {
    /**
     * Create Checkout Session for buying more interview credits
     */
    static async createCheckoutSession(userId: string) {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'AI Interview Credits (5 Pack)',
                        },
                        unit_amount: PRICE_PER_INTERVIEW * INTERVIEW_CREDITS_PER_PURCHASE,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/dashboard?checkout_success=true`,
            cancel_url: `${process.env.FRONTEND_URL}/dashboard?checkout_canceled=true`,
            client_reference_id: userId,
        });

        return session;
    }

    /**
     * Handle Webhook for successful payment
     */
    static async handleWebhookEvent(event: Stripe.Event) {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.client_reference_id;

            if (userId) {
                // Increment user credits by 5
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        credits: {
                            increment: INTERVIEW_CREDITS_PER_PURCHASE,
                        },
                    },
                });
            }
        }
    }
}
