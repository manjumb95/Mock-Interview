'use client';

import { useAuth } from '@/context/AuthContext';
import { FileText, Video, PlayCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardIndex() {
    const { user } = useAuth();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋</h1>
                <p className="text-slate-400">Ready to crush your next interview?</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary">
                        <PlayCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Start Interview</h3>
                    <p className="text-sm text-slate-400 mb-6 flex-1">Upload a target job description and your resume to begin a new AI mock interview session.</p>
                    <Link href="/dashboard/interviews/new" className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 transition block text-center">
                        New Interview
                    </Link>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 text-blue-400">
                        <Video className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Past Interviews</h3>
                    <p className="text-sm text-slate-400 mb-6 flex-1">Review your past transcripts, scores, and AI-generated improvement plans.</p>
                    <Link href="/dashboard/interviews" className="w-full bg-slate-800 text-white py-2 rounded-md font-medium hover:bg-slate-700 transition block text-center">
                        View History
                    </Link>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 text-purple-400">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Resume Vault</h3>
                    <p className="text-sm text-slate-400 mb-6 flex-1">Manage your uploaded resumes for quick access during new interview setups.</p>
                    <Link href="/dashboard/resumes" className="w-full bg-slate-800 text-white py-2 rounded-md font-medium hover:bg-slate-700 transition block text-center">
                        Manage Resumes
                    </Link>
                </div>
            </div>
        </div>
    );
}
