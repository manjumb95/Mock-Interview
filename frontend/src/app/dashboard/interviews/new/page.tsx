'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FileText, Loader2, Briefcase, ArrowRight } from 'lucide-react';
import { Resume } from '@/types/interview';

export default function NewInterviewPage() {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [selectedResumeId, setSelectedResumeId] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [company, setCompany] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const { data } = await api.get<Resume[]>('/resumes');
                setResumes(data);
                if (data.length > 0) {
                    setSelectedResumeId(data[0].id);
                }
            } catch (err) {
                setError('Failed to load resumes');
            } finally {
                setIsLoading(false);
            }
        };
        fetchResumes();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedResumeId) {
            setError('Please select a resume first');
            return;
        }

        // Disabled credit check for unlimited free interviews
        /* if (user && user.credits < 1) {
            setError("You don't have enough credits. Please purchase more.");
            return;
        } */

        setIsSubmitting(true);
        setError('');

        try {
            const { data } = await api.post('/interviews/start', {
                title: jobTitle,
                company: company,
                jobDescriptionText: jobDescription,
                resumeId: selectedResumeId
            });

            // redirect to interview room
            router.push(`/dashboard/interviews/${data.interviewId}`);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to start interview');
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Create New Interview</h1>
                <p className="text-slate-400">Configure your mock interview context based on a target job description.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
                {error && (
                    <div className="bg-destructive/15 text-destructive border border-destructive px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Select Resume
                    </h3>

                    {resumes.length === 0 ? (
                        <div className="bg-slate-800 p-4 rounded-md text-sm text-slate-400">
                            No resumes found. Please upload one in the Resume Vault first.
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-3">
                            {resumes.map(r => (
                                <div
                                    key={r.id}
                                    onClick={() => setSelectedResumeId(r.id)}
                                    className={`p-4 rounded-md border cursor-pointer transition-colors ${selectedResumeId === r.id ? 'border-primary bg-primary/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedResumeId === r.id ? 'border-primary' : 'border-slate-500'}`}>
                                            {selectedResumeId === r.id && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white truncate">{r.parsedData?.name || 'Resume'}</p>
                                            <p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <hr className="border-slate-800" />

                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary" />
                        Job Description
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Job Title / Role</label>
                            <input
                                type="text"
                                required
                                value={jobTitle}
                                onChange={e => setJobTitle(e.target.value)}
                                placeholder="e.g. Senior Frontend Engineer"
                                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Company</label>
                            <input
                                type="text"
                                required
                                value={company}
                                onChange={e => setCompany(e.target.value)}
                                placeholder="e.g. Google"
                                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Raw Job Description</label>
                        <textarea
                            required
                            value={jobDescription}
                            onChange={e => setJobDescription(e.target.value)}
                            placeholder="Paste the full job description here..."
                            rows={6}
                            className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary resize-y"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting || resumes.length === 0}
                        className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-6 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                Start Interview
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
