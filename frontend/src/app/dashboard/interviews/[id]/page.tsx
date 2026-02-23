'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Send, Loader2, StopCircle, Video, Mic, MicOff, Volume2 } from 'lucide-react';

interface Message {
    role: 'interviewer' | 'candidate';
    content: string;
}

export default function InterviewRoom() {
    const { id } = useParams();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState('');

    // Voice State
    const [isRecording, setIsRecording] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    // Refs
    const chatEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, liveTranscript, isLoading]);

    // Setup Web Speech API for Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event: any) => {
                    let interimTranscript = '';
                    let finalTranscript = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }

                    if (finalTranscript) {
                        setInputMessage((prev) => (prev ? prev + ' ' : '') + finalTranscript);
                        setLiveTranscript('');
                    } else if (interimTranscript) {
                        setLiveTranscript(interimTranscript);
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    if (event.error !== 'no-speech') {
                        setIsRecording(false);
                        setLiveTranscript('');
                    }
                };

                recognition.onend = () => {
                    setIsRecording(false);
                    setLiveTranscript('');
                    // Note: We don't auto-send on end here to avoid sending incomplete sentences if speech recognition pauses internally. 
                    // Users will manually send or use the toggle button.
                };

                recognitionRef.current = recognition;
            } else {
                console.warn('Speech Recognition API not supported in this browser.');
                setError('Speech Recognition is not supported in this browser. Please use Chrome.');
            }
        }
    }, []);

    // Speak text function
    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Cancel any ongoing speech

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            utterance.onstart = () => setIsAiSpeaking(true);
            utterance.onend = () => setIsAiSpeaking(false);
            utterance.onerror = (e) => {
                console.error("Speech Synthesis Error:", e);
                setIsAiSpeaking(false);
            };

            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Text-to-Speech not supported in this browser.');
        }
    };

    // Make sure voices are loaded
    useEffect(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
        }
    }, []);

    // Initialize interview
    useEffect(() => {
        let mounted = true;
        const fetchInitialQuestion = async () => {
            try {
                const { data } = await api.post(`/interviews/${id}/next`, { answer: '' });

                if (!mounted) return;

                if (data.action === 'END_INTERVIEW') {
                    router.push(`/dashboard/interviews/${id}/evaluation`);
                    return;
                }

                setMessages([{ role: 'interviewer', content: data.question }]);
                speakText(data.question);
            } catch (err: any) {
                if (!mounted) return;
                setError(err.response?.data?.error || 'Failed to start interview stream');
            } finally {
                if (mounted) setIsInitializing(false);
            }
        };

        fetchInitialQuestion();

        return () => {
            mounted = false;
            // Cleanup speech synthesis on unmount
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [id, router]);

    const handleSendMessage = async (e?: React.FormEvent, forceMessage?: string) => {
        if (e) e.preventDefault();

        // Finalize any ongoing speech recognition
        if (isRecording && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
            setLiveTranscript('');
        }

        const candidateMsg = forceMessage || inputMessage.trim();
        if (!candidateMsg || isLoading) return;

        setInputMessage('');
        setMessages(prev => [...prev, { role: 'candidate', content: candidateMsg }]);
        setIsLoading(true);

        try {
            const { data } = await api.post(`/interviews/${id}/next`, { answer: candidateMsg });

            if (data.action === 'END_INTERVIEW') {
                await handleEndInterview();
                return;
            }

            setMessages(prev => [...prev, { role: 'interviewer', content: data.question }]);
            speakText(data.question);

        } catch (err: any) {
            setError('Failed to send text message.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) return;

        if (isRecording) {
            // Stopping recording. 
            recognitionRef.current.stop();
            setIsRecording(false);
            setLiveTranscript('');

            // Auto submit if there's transcribed text or an interim transcript
            setTimeout(() => {
                const finalMsg = inputMessage.trim() + (liveTranscript ? ' ' + liveTranscript.trim() : '');
                if (finalMsg) {
                    handleSendMessage(undefined, finalMsg);
                }
            }, 500);

        } else {
            // Stop AI if it is speaking so we don't record the AI
            if (isAiSpeaking && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                setIsAiSpeaking(false);
            }
            setInputMessage('');
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Failed to start recognition:", err);
            }
        }
    };


    const handleEndInterview = async () => {
        setIsLoading(true);
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        try {
            await api.post(`/interviews/${id}/end`);
            router.push(`/dashboard/interviews/${id}/evaluation`);
        } catch (err: any) {
            setError('Failed to finalize interview.');
            setIsLoading(false);
        }
    };

    if (isInitializing) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <Video className="w-12 h-12 text-primary animate-pulse mb-4" />
                <h2 className="text-xl font-medium text-white mb-2">Connecting to AI Interviewer...</h2>
                <p className="text-slate-400">Analyzing job description and preparing your first question.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isAiSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-green-500'} `}></div>
                    <span className="font-semibold text-white">Live Session {isAiSpeaking && '(AI Speaking)'}</span>
                </div>
                <button
                    onClick={handleEndInterview}
                    disabled={isLoading}
                    className="flex items-center gap-2 text-sm text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors font-medium border border-transparent hover:border-destructive/20"
                >
                    <StopCircle className="w-4 h-4" />
                    End Early
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {error && (
                    <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm text-center">
                        {error}
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${msg.role === 'candidate'
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-tl-sm'
                            }`}>
                            {msg.role === 'interviewer' && isAiSpeaking && index === messages.length - 1 && (
                                <Volume2 className="w-5 h-5 mb-2 text-blue-400 animate-pulse" />
                            )}
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {/* Live Transcript Bubble */}
                {liveTranscript && (
                    <div className="flex justify-end">
                        <div className="max-w-[80%] rounded-2xl px-5 py-3.5 bg-primary/40 text-primary-foreground/80 rounded-tr-sm border border-primary/20">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                <span className="text-xs uppercase font-bold tracking-wider text-primary-foreground/60 w-full text-left">Live Transcript</span>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-300 italic">{liveTranscript}...</p>
                        </div>
                    </div>
                )}

                {isLoading && !liveTranscript && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-5 py-3.5 flex items-center gap-2">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                <form onSubmit={handleSendMessage} className="relative flex items-end gap-2">
                    <textarea
                        value={inputMessage + (liveTranscript ? (inputMessage ? ' ' : '') + liveTranscript : '')}
                        onChange={(e) => {
                            if (!isRecording) {
                                setInputMessage(e.target.value);
                            }
                        }}
                        placeholder="Type your response or use voice..."
                        disabled={isLoading || isRecording}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary resize-none min-h-[56px] max-h-[150px]"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleRecording}
                            disabled={isLoading || isAiSpeaking}
                            className={`flex flex-col items-center justify-center transition-all h-14 min-w-[56px] px-4 rounded-xl border ${isRecording
                                ? 'bg-red-500 hover:bg-red-600 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
                                : 'bg-slate-800 hover:bg-slate-700 border-slate-600'
                                } disabled:opacity-50`}
                        >
                            {isRecording ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-slate-300" />}
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300/80 mt-1">
                                {isRecording ? 'Listening' : 'Talk'}
                            </span>
                        </button>

                        <button
                            type="submit"
                            disabled={(!inputMessage.trim() && !liveTranscript) || isLoading}
                            className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors h-14 w-14 flex items-center justify-center shrink-0"
                        >
                            <Send className="w-5 h-5 ml-1" />
                        </button>
                    </div>
                </form>
                <p className="text-center text-xs text-slate-500 mt-2">
                    Press Enter to send, Shift+Enter for new line. Hit Talk to use voice.
                </p>
            </div>
        </div>
    );
}
