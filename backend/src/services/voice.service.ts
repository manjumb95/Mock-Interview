import { Server, Socket } from 'socket.io';
import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { InterviewStateService } from './orchestrator.service';
import prisma from '../utils/prisma';

// Initialize Google Cloud Clients (Safe Initialization)
let speechClient: SpeechClient | null = null;
let ttsClient: TextToSpeechClient | null = null;

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
        speechClient = new SpeechClient();
        ttsClient = new TextToSpeechClient();
    } catch (error) {
        console.warn("Google Cloud Credentials invalid. Voice Service will be unavailable.");
    }
} else {
    console.warn("GOOGLE_APPLICATION_CREDENTIALS not found in .env. Voice Service will be unavailable.");
}

export class VoiceService {
    static setupSocket(io: Server) {
        io.on('connection', (socket: Socket) => {
            console.log(`New WebSocket connection: ${socket.id}`);

            let recognizeStream: any = null;
            let currentInterviewId: string | null = null;

            socket.on('start-interview-session', (data: { interviewId: string }) => {
                currentInterviewId = data.interviewId;
                console.log(`Socket ${socket.id} bound to interview ${currentInterviewId}`);
            });

            // Handle incoming audio stream from candidate
            socket.on('audio-stream', (data: Buffer) => {
                if (!speechClient) return;

                if (!recognizeStream) {
                    // Create a new stream
                    const request = {
                        config: {
                            encoding: 'WEBM_OPUS' as any, // Standard WebRTC audio format
                            sampleRateHertz: 48000,
                            languageCode: 'en-US',
                        },
                        interimResults: true, // We want live transcription
                    };

                    try {
                        recognizeStream = speechClient
                            .streamingRecognize(request)
                            .on('error', (err: any) => {
                                console.error('STT Stream Error:', err);
                                recognizeStream = null;
                            })
                            .on('data', (data: any) => {
                                const result = data.results[0];
                                if (result && result.alternatives[0]) {
                                    const transcript = result.alternatives[0].transcript;
                                    const isFinal = result.isFinal;

                                    // Broadcast back to frontend for live UI
                                    socket.emit('transcript-update', { text: transcript, isFinal });

                                    if (isFinal) {
                                        // When candidate stops speaking, trigger orchestration
                                        this.handleFinalTranscript(socket, currentInterviewId, transcript);
                                    }
                                }
                            });
                    } catch (e) {
                        console.error('Failed to create recognize stream:', e);
                    }
                }

                if (recognizeStream) {
                    recognizeStream.write(data);
                }
            });

            socket.on('stop-audio-stream', () => {
                if (recognizeStream) {
                    recognizeStream.end();
                    recognizeStream = null;
                }
            });

            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
                if (recognizeStream) {
                    recognizeStream.end();
                }
            });
        });
    }

    private static async handleFinalTranscript(socket: Socket, interviewId: string | null, text: string) {
        if (!interviewId) return;

        try {
            // Validate Interview Exists
            const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
            if (!interview || interview.status !== 'IN_PROGRESS') {
                return;
            }

            // 1. Send text to Gemini Orchestrator
            const orchestration = await InterviewStateService.generateNextOrchestratedQuestion(interviewId, text);

            // Sync with DB
            const updatedState = await InterviewStateService.getState(interviewId);
            if (updatedState) {
                await prisma.interview.update({
                    where: { id: interviewId },
                    data: { transcript: updatedState.transcript as any }
                });
            }

            // Send raw text question back to UI first (for immediate display)
            socket.emit('ai-question-text', { question: orchestration.question });

            // 2. Convert LLM question to Speech (TTS)
            if (ttsClient && orchestration.question) {
                const request = {
                    input: { text: orchestration.question },
                    // Select the language and SSML voice gender (optional)
                    voice: { languageCode: 'en-US', name: 'en-US-Journey-F' },
                    // select the type of audio encoding
                    audioConfig: { audioEncoding: 'MP3' as any },
                };

                const [response] = await ttsClient.synthesizeSpeech(request);

                // 3. Stream audio back to frontend
                socket.emit('ai-audio-response', response.audioContent);
            }

            // Handle forced interview end
            if (orchestration.action === 'END_INTERVIEW') {
                socket.emit('interview-ended', { feedback: orchestration.feedback });
            }

        } catch (error) {
            console.error("Voice Orchestration Error:", error);
            socket.emit('voice-error', { message: "Failed to process interview response." });
        }
    }
}
