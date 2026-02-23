import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { createCheckoutSession, handleStripeWebhook } from '../controllers/payment.controller';

const router = Router();

router.post('/checkout', requireAuth, createCheckoutSession);
router.post('/webhook', handleStripeWebhook);

export default router;
