'use client';

import { useAuth } from '@/context/AuthContext';
import { Check, Star } from 'lucide-react';

export default function BillingPage() {
    const { user } = useAuth();

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Billing & Credits</h1>
                <p className="text-slate-400">Manage your interview credits and billing history.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-white mb-1">Current Balance</h3>
                    <p className="text-sm text-slate-400">You have <span className="text-primary font-bold">Unlimited</span> interview credits remaining during our beta period.</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-primary/20 flex flex-col items-center justify-center text-primary font-bold text-xl border border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    <Star className="w-8 h-8" />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 pt-4">

                {/* Pricing Tier */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />

                    <div className="z-10 flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">Beta Access</h3>
                        <p className="text-slate-400 text-sm mb-6">Enjoy full access to all features for free.</p>

                        <div className="flex items-baseline gap-1 mb-8">
                            <span className="text-4xl font-extrabold text-white">$0</span>
                            <span className="text-slate-500 font-medium">/forever</span>
                        </div>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3 text-sm text-slate-300">
                                <Check className="w-5 h-5 text-primary shrink-0" />
                                Unlimited AI Mock Interviews
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-300">
                                <Check className="w-5 h-5 text-primary shrink-0" />
                                Advanced Skill Gap Analysis
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-300">
                                <Check className="w-5 h-5 text-primary shrink-0" />
                                Personalized Improvement Plans
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-300">
                                <Check className="w-5 h-5 text-primary shrink-0" />
                                Lifetime Transcript Access
                            </li>
                        </ul>
                    </div>

                    <div className="z-10 mt-auto">
                        <button
                            disabled={true}
                            className="w-full bg-slate-800 text-slate-400 font-medium py-3 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                            Active Plan
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col justify-center text-center items-center">
                    <h3 className="text-xl font-medium text-white mb-2">Need a custom plan?</h3>
                    <p className="text-sm text-slate-400 mb-6 max-w-xs">Are you an enterprise team looking to train your engineers? Contact us for bulk options in the future.</p>
                    <button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                        Contact Sales
                    </button>
                </div>
            </div>
        </div>
    );
}
