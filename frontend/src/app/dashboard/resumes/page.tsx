'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Resume } from '@/types/interview';
import { FileText, Upload, Loader2, Trash2 } from 'lucide-react';

export default function ResumesPage() {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const fetchResumes = async () => {
        try {
            const { data } = await api.get<Resume[]>('/resumes');
            setResumes(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load resumes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchResumes();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Only PDF files are supported');
            return;
        }

        setIsUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('resume', file);

        try {
            await api.post('/resumes/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchResumes();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to upload resume');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Resume Vault</h1>
                    <p className="text-slate-400">Manage your resumes for mock interviews.</p>
                </div>
                <div>
                    <label className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md cursor-pointer transition flex items-center gap-2 text-sm font-medium">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Upload PDF
                        <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md border border-destructive">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : resumes.length === 0 ? (
                <div className="border border-dashed border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                    <FileText className="w-12 h-12 text-slate-500 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-1">No resumes uploaded</h3>
                    <p className="text-slate-400 text-sm max-w-sm">Upload your first PDF resume to start tailoring your mock interviews.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resumes.map((resume) => (
                        <div key={resume.id} className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/20 p-2 rounded-md">
                                        <FileText className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm line-clamp-1">{resume.parsedData?.name || 'Parsed Resume'}</p>
                                        <p className="text-xs text-slate-500">{new Date(resume.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button className="text-slate-500 hover:text-destructive transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1">
                                {resume.parsedData?.skills && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {resume.parsedData.skills.slice(0, 5).map((skill: string, i: number) => (
                                            <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                                                {skill}
                                            </span>
                                        ))}
                                        {resume.parsedData.skills.length > 5 && (
                                            <span className="text-[10px] text-slate-500 px-1 py-0.5">+{resume.parsedData.skills.length - 5}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
