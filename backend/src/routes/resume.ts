import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/auth';
import { uploadResume, getResumes } from '../controllers/resume.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', requireAuth, upload.single('resume'), uploadResume);
router.get('/', requireAuth, getResumes);

export default router;
