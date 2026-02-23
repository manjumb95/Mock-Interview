import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { StripeService } from '../services/stripe.service';

export const createCheckoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const session = await StripeService.createCheckoutSession(userId);

        if (!session.url) {
            throw new Error("Stripe did not return a checkout URL");
        }

        res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Create checkout session error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
};

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        // In a production environment, you MUST verify the Stripe signature here
        // using req.headers['stripe-signature'] and the raw body.
        // For this scaffolding, we pass the parsed body directly for demonstration.
        const event = req.body;

        await StripeService.handleWebhookEvent(event);

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Stripe webhook error:', error);
        res.status(400).send(`Webhook Error: ${error}`);
    }
};
