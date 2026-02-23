import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../utils/prisma';
import { ResumeService } from '../services/resume.service';
import { GeminiService } from '../services/gemini.service';

export const uploadResume = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const file = req.file;
        const userId = req.user?.userId;

        if (!file || !userId) {
            res.status(400).json({ error: 'File and Authorization are required' });
            return;
        }

        if (file.mimetype !== 'application/pdf') {
            res.status(400).json({ error: 'Only PDF files are currently supported' });
            return;
        }

        // 1. Extract raw text
        const rawText = await ResumeService.extractTextFromPDF(file.buffer);

        if (!rawText || rawText.trim() === '') {
            res.status(400).json({ error: 'Failed to extract text. Please ensure the PDF is text-based and not a scanned image.' });
            return;
        }

        // 2. Parse into structured JSON via Gemini
        const parsedData = await GeminiService.parseResume(rawText);

        // 3. For a production app, we would upload the buffer to AWS S3 here
        // and store the return URL. For this scaffolding, we use a placeholder URL.
        const s3Url = 'https://s3.amazonaws.com/placeholder-mock-url/' + file.originalname;

        // 4. Save to Database
        const resume = await prisma.resume.create({
            data: {
                userId,
                s3Url,
                parsedData
            }
        });

        res.status(201).json({
            message: parsedData.error ? 'Resume saved, but AI parsing failed cleanly' : 'Resume uploaded and parsed successfully',
            resume
        });

    } catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to process resume internally' });
    }
};

export const getResumes = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const resumes = await prisma.resume.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(resumes);
    } catch (error) {
        console.error('Get resumes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
