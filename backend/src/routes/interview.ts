import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { startInterview, nextQuestion, endInterview } from '../controllers/interview.controller';

const router = Router();

router.post('/start', requireAuth, startInterview);
router.post('/:id/next', requireAuth, nextQuestion);
router.post('/:id/end', requireAuth, endInterview);

export default router;
