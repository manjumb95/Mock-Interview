import { Redis } from '@upstash/redis';
import { GeminiService } from './gemini.service';

const HAS_REDIS = !!process.env.UPSTASH_REDIS_REST_URL;

const redis = HAS_REDIS ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
}) : null;

// Fallback in-memory cache for local development if Redis is not configured
const memoryCache = new Map<string, string>();

// Deep Dive Topic Interface
export interface DeepDiveTopic {
    topic: string;
    probed: boolean;
}

// Conversation Exchange Interface
export interface InterviewExchange {
    question: string;
    answer: string;
    geminiFeedback?: string;
}

// Global Interview State mapped to Redis
export interface InterviewState {
    interviewId: string;
    userId: string;
    status: 'IN_PROGRESS' | 'COMPLETED';

    // Tracking Metrics
    currentQuestionIndex: number;
    followUpCount: number;
    totalQuestionsAsked: number;
    startTime: number;

    // Dynamic content
    deepDiveTopics: DeepDiveTopic[];
    transcript: InterviewExchange[];

    // Context needed for next prompts
    jobTitle: string;
    candidateName: string;
    baseSkillGaps: string[];
}

export class InterviewStateService {

    private static getKey(interviewId: string): string {
        return `interview_state:${interviewId}`;
    }

    /**
     * Initializes a brand new interview session in Redis
     */
    static async initializeState(params: {
        interviewId: string;
        userId: string;
        jobTitle: string;
        candidateName: string;
        initialTopics: string[];
    }): Promise<InterviewState> {

        const initialState: InterviewState = {
            interviewId: params.interviewId,
            userId: params.userId,
            status: 'IN_PROGRESS',
            currentQuestionIndex: 0,
            followUpCount: 0,
            totalQuestionsAsked: 0,
            startTime: Date.now(),
            deepDiveTopics: params.initialTopics.map(t => ({ topic: t, probed: false })),
            transcript: [],
            jobTitle: params.jobTitle,
            candidateName: params.candidateName,
            baseSkillGaps: params.initialTopics
        };

        const serialized = JSON.stringify(initialState);
        if (redis) {
            await redis.set(this.getKey(params.interviewId), serialized, { ex: 86400 });
        } else {
            memoryCache.set(this.getKey(params.interviewId), serialized);
        }

        return initialState;
    }

    /**
     * Retrieves the current state of an interview
     */
    static async getState(interviewId: string): Promise<InterviewState | null> {
        const key = this.getKey(interviewId);

        if (redis) {
            return await redis.get<InterviewState>(key);
        }

        const data = memoryCache.get(key);
        return data ? JSON.parse(data) as InterviewState : null;
    }

    /**
     * Saves the modified state back to Redis
     */
    static async saveState(state: InterviewState): Promise<void> {
        const key = this.getKey(state.interviewId);
        const serialized = JSON.stringify(state);

        if (redis) {
            await redis.set(key, serialized, { ex: 86400 });
        } else {
            memoryCache.set(key, serialized);
        }
    }

    /**
     * Helper to append a new QA exchange and increment counters
     */
    static async addExchange(interviewId: string, exchange: InterviewExchange, isFollowUp: boolean): Promise<InterviewState> {
        const state = await this.getState(interviewId);
        if (!state) throw new Error("Interview state not found");

        state.transcript.push(exchange);
        state.totalQuestionsAsked++;

        if (isFollowUp) {
            state.followUpCount++;
        } else {
            state.currentQuestionIndex++;
            state.followUpCount = 0; // Reset followups on a new base question
        }

        await this.saveState(state);
        return state;
    }

    /**
     * Clears the session from Redis (usually called when the interview completes)
     */
    static async clearState(interviewId: string): Promise<void> {
        const key = this.getKey(interviewId);
        if (redis) {
            await redis.del(key);
        } else {
            memoryCache.delete(key);
        }
    }

    /**
     * Replaces the old Gemini Next Question logic.
     * Takes the Redis State and generates an appropriate context-aware question.
     */
    static async generateNextOrchestratedQuestion(interviewId: string, answerToEvaluate?: string): Promise<{ question?: string; isFollowUp?: boolean; feedback?: string; action?: 'END_INTERVIEW' | 'CONTINUE' }> {
        const state = await this.getState(interviewId);
        if (!state) throw new Error("State not found");

        let feedback = '';
        let isFollowUp = false;

        // 1. If an answer was provided to the previous question, evaluate it first
        if (answerToEvaluate && state.transcript.length > 0) {
            const lastExchange = state.transcript[state.transcript.length - 1];

            // Generate quick feedback and deep dive flags from Gemini
            const evalResult = await GeminiService.evaluateAnswer(lastExchange.question, answerToEvaluate, state.jobTitle);
            feedback = evalResult.feedback;

            // Save the Answer & Feedback into the transcript
            lastExchange.answer = answerToEvaluate;
            lastExchange.geminiFeedback = feedback;

            // If Gemini flags a missing concept, add it to our Deep Dive topics
            if (evalResult.newDeepDiveTopic) {
                state.deepDiveTopics.push({ topic: evalResult.newDeepDiveTopic, probed: false });
            }

            // Decide if we should follow up or move on
            isFollowUp = evalResult.requiresFollowUp && state.followUpCount < 2; // Hard cap at 2 followups

            await this.saveState(state);
        }

        // 2. Generate the Next Question
        // Fetch the updated state
        const latestState = await this.getState(interviewId) || state;

        // Flag the topic as probed if we are moving onto a new deep dive
        const targetDeepDive = latestState.deepDiveTopics.find(t => !t.probed);
        const nextTopicTarget = targetDeepDive?.topic || latestState.baseSkillGaps[latestState.currentQuestionIndex % latestState.baseSkillGaps.length];

        if (targetDeepDive && !isFollowUp) {
            targetDeepDive.probed = true;
        }

        const elapsedMinutes = (Date.now() - latestState.startTime) / 60000;

        // Dynamic Stop Conditions based on Time and Content
        const allGapsCovered = latestState.currentQuestionIndex >= latestState.baseSkillGaps.length;
        const allDeepDivesCovered = !latestState.deepDiveTopics.some(t => !t.probed);

        // Enforce hard cap of 60 minutes or graceful wrap-up after 30 mins
        if (elapsedMinutes >= 60 || (elapsedMinutes >= 30 && allGapsCovered && allDeepDivesCovered)) {
            return { action: 'END_INTERVIEW', feedback: feedback || "Time is up. Concluding the interview." };
        }

        // Just in case time travels or we want a rapid exit fallback, cap questions at 30
        if (latestState.totalQuestionsAsked >= 30) {
            return { action: 'END_INTERVIEW', feedback: feedback || "We have covered enough topics today." };
        }

        const prompt = `
You are an expert technical interviewer hiring for a ${latestState.jobTitle} position. 
The candidate is ${latestState.candidateName}.

Interview Context:
- Target Topic for this question: ${nextTopicTarget}
- This is question #${latestState.totalQuestionsAsked + 1}
- Follow-up depth: ${latestState.followUpCount}/2
- Elapsed Time: ${Math.floor(elapsedMinutes)} minutes (Target duration is 30 to 60 minutes).

Previous Transcript History (Last 3 exchanges):
${JSON.stringify(latestState.transcript.slice(-3))}

Generate the EXACT text you will say next to the candidate. 
If this is a follow-up, probe deeper into their last answer. 
If this is a new topic (${nextTopicTarget}), transition smoothly and ask a challenging question about it.
Do not include any pleasantries or "Okay I will ask that" text. Just output the question.
`;

        // We use the raw generateContent, not JSON mode, for pure string text
        const response = await GeminiService.generateRawText(prompt);

        // 3. Append the brand new question to the transcript array and iterate counters
        await this.addExchange(interviewId, { question: response, answer: '' }, isFollowUp);

        return {
            question: response,
            isFollowUp: isFollowUp,
            feedback: feedback || undefined,
            action: 'CONTINUE'
        };
    }
}
