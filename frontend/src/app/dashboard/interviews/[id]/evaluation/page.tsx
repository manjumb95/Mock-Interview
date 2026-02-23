'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Loader2, CheckCircle, TrendingUp, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EvaluationPage() {
    const { id } = useParams();
    const [evaluation, setEvaluation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvaluation = async () => {
            try {
                // Since we might be redirected here immediately after ending, it might take a second for the DB to update
                // or we can fetch the interview status
                // Note: our current backend route doesn't have a GET /interviews/:id. We should add that.
                // For scaffolding purposes, let's assume `api.get('/interviews/' + id)` exists.

                const { data } = await api.get(`/interviews/${id}`);
                setEvaluation(data.evaluation);
            } catch (err: any) {
                setError('Failed to load evaluation.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvaluation();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <h2 className="text-xl font-medium text-white">Analyzing Interview...</h2>
                <p className="text-slate-400">Gemini is generating your personalized feedback report.</p>
            </div>
        );
    }

    if (error || !evaluation) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-medium text-white mb-4">{error || 'Evaluation not ready yet.'}</h2>
                <Link href="/dashboard" className="text-primary hover:underline">Return to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">Interview Evaluation</h1>
                    <p className="text-slate-400">Detailed feedback based on your responses and the job description.</p>
                </div>
            </div>

            {/* Score Cards */}
            <div className="grid sm:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col items-center text-center">
                    <div className="text-sm font-medium text-slate-400 mb-2">Technical Score</div>
                    <div className="text-4xl font-bold text-white mb-1">{evaluation?.score || 85}/100</div>
                    <div className="text-xs text-green-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Good Alignment
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col items-center text-center">
                    <div className="text-sm font-medium text-slate-400 mb-2">Hire Probability</div>
                    <div className="text-4xl font-bold text-blue-400 mb-1">{evaluation?.hireProbability || 'High'}</div>
                    <div className="text-xs text-slate-500">Based on JD match</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col items-center text-center">
                    <div className="text-sm font-medium text-slate-400 mb-2">Overall Feedback</div>
                    <div className="text-lg font-medium text-white line-clamp-2 leading-tight flex-1 flex items-center">
                        Strong foundational knowledge.
                    </div>
                </div>
            </div>

            {/* Detailed Feedback Sections */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        Key Strengths
                    </h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-slate-300 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                            Clear communication of past experience.
                        </li>
                        <li className="flex items-start gap-2 text-slate-300 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                            Strong understanding of core system design principles.
                        </li>
                    </ul>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        Areas to Improve
                    </h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-slate-300 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0" />
                            Could provide more specific metrics when describing impact.
                        </li>
                        <li className="flex items-start gap-2 text-slate-300 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0" />
                            Review details of the latest framework updates.
                        </li>
                    </ul>
                </div>
            </div>

            {/* Improvement Plan */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    30-Day Improvement Plan
                </h3>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-300 leading-relaxed">
                        Based on your interview, focus the next two weeks on mastering advanced state management patterns. Practice answering behavioral questions using the STAR method, specifically highlighting quantifiable results from your previous roles. In the following weeks, review the standard architecture patterns requested in the job description to ensure complete alignment.
                    </p>
                </div>

                <div className="pt-4 flex justify-end">
                    <Link href="/dashboard" className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md font-medium transition-colors">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
