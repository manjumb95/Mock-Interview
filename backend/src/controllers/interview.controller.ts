import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../utils/prisma';
import { GeminiService } from '../services/gemini.service';
import { InterviewStateService } from '../services/orchestrator.service';

export const startInterview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { title, company, jobDescriptionText, resumeId } = req.body;

        if (!userId || !jobDescriptionText || !resumeId) {
            res.status(400).json({ error: 'Job description text and Resume ID are required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(403).json({ error: 'User not found' });
            return;
        }

        const resume = await prisma.resume.findUnique({ where: { id: resumeId, userId } });
        if (!resume) {
            res.status(404).json({ error: 'Resume not found' });
            return;
        }

        // 1. Parse JD using Gemini
        const jdParsedData = await GeminiService.parseJobDescription(jobDescriptionText);

        // 2. Save JD to database
        const newJd = await prisma.jobDescription.create({
            data: {
                title: title || jdParsedData.title || 'Untitled Role',
                company: company || 'Unknown Company',
                rawText: jobDescriptionText,
                parsedData: jdParsedData
            }
        });

        // 3. Generate Skill Gap Analysis
        const skillGapAnalysis = await GeminiService.generateSkillGapAnalysis(JSON.stringify(resume.parsedData), jdParsedData);

        // 4. Create Interview Record
        const interview = await prisma.interview.create({
            data: {
                userId,
                jobDescriptionId: newJd.id,
                status: 'IN_PROGRESS',
                skillGapAnalysis,
                transcript: [] // Start with empty transcript array
            }
        });

        // 5. Initialize the interview tracking context in Redis
        const candidateName = user.name || 'Candidate';

        // Extract basic gaps from the Gemini analysis safely
        let initialTopics: string[] = [];
        if (skillGapAnalysis && typeof skillGapAnalysis === 'object') {
            const gaps = (skillGapAnalysis as any).missingSkills || [];
            initialTopics = Array.isArray(gaps) ? gaps : [];
        }

        // Fallback default topics if skill gap fails to provide structured array
        if (initialTopics.length === 0) {
            initialTopics = ['General Background', 'Technical Fundamentals', 'Problem Solving'];
        }

        await InterviewStateService.initializeState({
            interviewId: interview.id,
            userId,
            jobTitle: newJd.title,
            candidateName,
            initialTopics
        });

        res.status(201).json({
            message: 'Interview initialized successfully',
            interviewId: interview.id,
            skillGapAnalysis
        });

    } catch (error) {
        console.error('Start interview error:', error);
        res.status(500).json({ error: 'Failed to initialize interview' });
    }
};

export const nextQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const interviewId = req.params.id as string;
        const { answer } = req.body; // candidate's previous answer

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const interview = await prisma.interview.findFirst({
            where: { id: interviewId, userId }
        });

        if (!interview) {
            res.status(404).json({ error: 'Interview not found' });
            return;
        }

        if (interview.status === 'COMPLETED') {
            res.status(400).json({ error: 'Interview already completed' });
            return;
        }

        // Validate Redis Session exists
        const state = await InterviewStateService.getState(interviewId);

        if (!state) {
            // If Redis session expired but DB says IN_PROGRESS, force complete it.
            res.status(400).json({ error: 'Interview session expired or malformed. Please start a new interview.' });
            return;
        }

        // Orchestrate via Redis + Gemini (Handles timer and termination logic)
        const orchestration = await InterviewStateService.generateNextOrchestratedQuestion(
            interview.id,
            answer // undefined on the very first question
        );

        // Update Postgres transcript to stay in sync with Redis passively
        const updatedState = await InterviewStateService.getState(interview.id);
        if (updatedState) {
            await prisma.interview.update({
                where: { id: interviewId },
                data: { transcript: updatedState.transcript as any }
            });
        }

        if (orchestration.action === 'END_INTERVIEW') {
            res.status(200).json({ action: 'END_INTERVIEW', feedback: orchestration.feedback });
            return;
        }

        res.status(200).json({
            question: orchestration.question,
            isFollowUp: orchestration.isFollowUp,
            feedback: orchestration.feedback
        });

    } catch (error) {
        console.error('Next question error:', error);
        res.status(500).json({ error: 'Failed to generate question' });
    }
};

export const endInterview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const interviewId = req.params.id as string;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const interview = await prisma.interview.findFirst({
            where: { id: interviewId, userId },
            include: { jobDescription: true }
        });

        if (!interview) {
            res.status(404).json({ error: 'Interview not found' });
            return;
        }

        const currentTranscript: any[] = Array.isArray(interview.transcript) ? interview.transcript : [];

        // Generate final evaluation based on the Postgres Transcript dump
        const evaluation = await GeminiService.generateEvaluation(currentTranscript, interview.jobDescription.parsedData);

        const updatedInterview = await prisma.interview.update({
            where: { id: interviewId },
            data: {
                status: 'COMPLETED',
                evaluation
            }
        });

        // Cleanup Redis memory session layer
        await InterviewStateService.clearState(interviewId);

        res.status(200).json({
            message: 'Interview completed',
            evaluation: updatedInterview.evaluation
        });

    } catch (error) {
        console.error('End interview error:', error);
        res.status(500).json({ error: 'Failed to complete interview' });
    }
};
