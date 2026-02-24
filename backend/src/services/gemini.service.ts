import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class GeminiService {
    /**
     * Parse a raw resume string into structured JSON
     */
    static async parseResume(text: string, retries = 2): Promise<any> {
        const prompt = `
    Extract the following information from the provided resume text and return it as a structured JSON object.
    
    Structure:
    {
      "name": "full name",
      "email": "email address",
      "phone": "phone number",
      "skills": ["skill1", "skill2"],
      "experience": [
        { "company": "", "role": "", "duration": "", "description": "" }
      ],
      "education": [
        { "institution": "", "degree": "", "year": "" }
      ]
    }

    Resume Text:
    ${text}
    
    Return ONLY valid JSON without markdown formatting.
    `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-lite',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                }
            });

            if (!response.text) {
                throw new Error("No response from Gemini");
            }

            // Clean markdown blocks if inadvertently included
            const cleanStr = response.text.replace(/```json/gi, '').replace(/```/gi, '').trim();
            const parsed = JSON.parse(cleanStr);

            // Basic Type Validation
            if (!parsed || typeof parsed !== 'object') {
                throw new Error("Parsed result is not a valid JSON object");
            }

            // Default fallback arrays to avoid frontend mapping crashes
            parsed.skills = Array.isArray(parsed.skills) ? parsed.skills : [];
            parsed.experience = Array.isArray(parsed.experience) ? parsed.experience : [];
            parsed.education = Array.isArray(parsed.education) ? parsed.education : [];

            return parsed;
        } catch (error) {
            console.error('Gemini Parse Resume Error (Retries left: ' + retries + '):', error);
            if (retries > 0) {
                console.log(`Rate limit hit. Retrying parseResume in 4s...`);
                await delay(4000);
                return this.parseResume(text, retries - 1);
            }

            // Return a safe fallback to allow the database to still store the raw PDF for later
            return {
                name: "Unparsed Candidate",
                email: "",
                phone: "",
                skills: [],
                experience: [],
                education: [],
                error: "Parsing failed due to malformed output"
            };
        }
    }

    /**
     * Parse a raw Job Description into structured JSON requirements
     */
    static async parseJobDescription(text: string, retries = 2): Promise<any> {
        const prompt = `
        Extract the key requirements from the provided job description and return it as a structured JSON object.

        Structure:
        {
            "title": "Job Title",
            "mandatorySkills": ["skill1", "skill2"],
            "niceToHaveSkills": ["skill3", "skill4"],
            "responsibilities": ["resp1", "resp2"],
            "experienceLevel": "e.g., Junior, Mid, Senior, 3+ years"
        }

        Job Description Text:
        ${text}
        
        Return ONLY valid JSON without markdown formatting.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-lite',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                }
            });

            if (!response.text) {
                throw new Error("No response from Gemini");
            }

            const cleanStr = response.text.replace(/```json/gi, '').replace(/```/gi, '').trim();
            const parsed = JSON.parse(cleanStr);

            if (!parsed || typeof parsed !== 'object') {
                throw new Error("Parsed result is not a valid JSON object");
            }

            return parsed;
        } catch (error) {
            console.error('Gemini JD Parse Error (Retries left: ' + retries + '):', error);
            if (retries > 0) {
                console.log(`Rate limit hit. Retrying parseJobDescription in 4s...`);
                await delay(4000);
                return this.parseJobDescription(text, retries - 1);
            }
            throw error;
        }
    }

    /**
     * Cross-references Resume vs JD to find missing skills
     */
    static async generateSkillGapAnalysis(resumeContent: string, jdContent: string, retries = 2): Promise<any> {
        const prompt = `
        Compare this Candidate Resume against the Job Description.
        Identify exactly 5 core technical topics or required skills from the JD that the candidate is WEAKEST in or entirely missing.
        These 5 topics will be used as the interview questions.
        
        Return ONLY a JSON list of 5 string topics. Example: ["System Design", "Kubernetes", "React Hooks", "PostgreSQL indexing", "O Auth"]

        Resume:
        ${resumeContent}

        Job Description:
        ${jdContent}
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-lite',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                }
            });

            if (!response.text) return null;

            const cleanStr = response.text.replace(/```json/gi, '').replace(/```/gi, '').trim();
            return JSON.parse(cleanStr);
        } catch (error) {
            console.error('Gemini Skill Gap Error (Retries left: ' + retries + '):', error);
            if (retries > 0) {
                console.log(`Rate limit hit. Retrying generateSkillGapAnalysis in 4s...`);
                await delay(4000);
                return this.generateSkillGapAnalysis(resumeContent, jdContent, retries - 1);
            }
            throw error;
        }
    }

    /**
     * Helper to return raw string text instead of parsing JSON
     */
    static async generateRawText(prompt: string): Promise<string> {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite', // Uses generic alias to dodge beta strict daily quotas
            contents: prompt,
        });

        if (!response.text) {
            throw new Error("No response from Gemini");
        }

        return response.text;
    }

    /**
     * Evaluates a candidate's answer and determines if follows ups are needed
     */
    static async evaluateAnswer(question: string, answer: string, contextTitle: string): Promise<{ feedback: string; requiresFollowUp: boolean; newDeepDiveTopic?: string }> {
        const prompt = `
        You are a senior technical interviewer for a ${contextTitle} position. 
        Evaluate the candidate's answer to this question:

        Question: "${question}"
        Target's Answer: "${answer}"

        Return your evaluation EXACTLY as this JSON structure:
        {
          "feedback": "A very brief 1-sentence note on the quality of their answer.",
          "requiresFollowUp": true/false (true if the answer was shallow or missed the core concept),
          "newDeepDiveTopic": "Identify 1 highly specific missing concept to drill into, or leave blank if answered perfectly"
        }
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-lite',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                }
            });

            if (!response.text) throw new Error("No eval generated");

            const cleanStr = response.text.replace(/```json/gi, '').replace(/```/gi, '').trim();
            const parsed = JSON.parse(cleanStr);

            return {
                feedback: parsed.feedback || '',
                requiresFollowUp: !!parsed.requiresFollowUp,
                newDeepDiveTopic: parsed.newDeepDiveTopic
            };
        } catch (error) {
            console.error("Evaluation Error", error);
            return { feedback: "Answer recorded.", requiresFollowUp: false };
        }
    }

    /**
     * Final simulation evaluation
     */
    static async generateEvaluation(transcript: any[], jdJson: any): Promise<any> {
        const prompt = `
        You are an expert technical interviewer evaluating a full candidate interview.
        Review the transcript of questions and answers against the Job Requirements.
        
        Generate a comprehensive feedback report.
        
        Return ONLY valid JSON:
        {
          "overallScore": 85,
          "strengths": ["string", "string"],
          "weaknesses": ["string", "string"],
          "detailedFeedback": "A paragraph highlighting interview performance."
        }

        Job Description requirements:
        ${JSON.stringify(jdJson)}

        Interview Transcript:
        ${JSON.stringify(transcript)}
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-lite',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                }
            });

            if (!response.text) return null;

            const cleanStr = response.text.replace(/```json/gi, '').replace(/```/gi, '').trim();
            return JSON.parse(cleanStr);
        } catch (error) {
            console.error("Evaluation generation error", error);
            return null;
        }
    }
}
