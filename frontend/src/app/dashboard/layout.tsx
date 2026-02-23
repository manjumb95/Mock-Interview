'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Video, LayoutDashboard, FileText, CreditCard, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Interviews', href: '/dashboard/interviews', icon: Video },
        { name: 'Resumes', href: '/dashboard/resumes', icon: FileText },
        { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    ];

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
                {/* Sidebar */}
                <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
                    <div className="h-16 flex items-center px-6 border-b border-slate-800">
                        <Link href="/" className="flex items-center gap-2">
                            <Video className="w-6 h-6 text-primary" />
                            <span className="font-bold text-lg tracking-tight text-white">AI Interview Pro</span>
                        </Link>
                    </div>

                    <div className="p-4 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                {user?.name?.charAt(0) || user?.email.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between bg-slate-800 rounded-md p-2 px-3">
                            <span className="text-xs text-slate-400">Interview Credits</span>
                            <span className="text-sm font-bold text-white">Unlimited</span>
                        </div>
                    </div>

                    <nav className="flex-1 p-4 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-slate-800">
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </aside>

                {/* Main content */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    <header className="h-16 flex items-center justify-between px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
                        <h1 className="text-lg font-semibold text-white">Provider Console</h1>
                        <div className="flex items-center gap-4">
                            {/* Header Actions */}
                            {/* <Link href="/dashboard/billing" className="text-xs font-medium bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full hover:bg-slate-700 transition">
                                Buy Credits
                            </Link> */}
                        </div>
                    </header>
                    <div className="flex-1 overflow-auto p-8 relative">
                        <div className="absolute inset-0 bg-[url('/grid-bg.svg')] bg-center pointer-events-none opacity-5" />
                        <div className="relative z-10 max-w-5xl mx-auto">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
