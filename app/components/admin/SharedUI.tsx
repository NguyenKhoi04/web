import React from 'react';

export function Card({ title, subtitle, icon, gradient, children }: { title: string; subtitle?: string; icon?: string; gradient: string; children: React.ReactNode; }) {
    return (
        <div className="relative mb-10">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r opacity-20 blur-2xl pointer-events-none from-white/10 to-transparent" />
            <div className="relative rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 lg:p-8 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                            <span className="text-2xl"> {icon} </span>
                        </div>
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold">{title}</h2>
                            {subtitle && <p className="text-blue-200 text-sm mt-1">{subtitle}</p>}
                        </div>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
}

export function Label({ children, icon, className = '' }: any) {
    return (
        <div className={`flex items-center gap-2 text-sm font-bold text-blue-200 ${className}`}>
            {icon && <span>{icon}</span>}
            <span>{children}</span>
        </div>
    );
}

export function ToggleRow({ label, checked, onChange, icon }: { label: string; checked: boolean; onChange: (v: boolean) => void; icon?: string; }) {
    return (
        <div className="flex items-center justify-between rounded-2xl border-2 border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3">
            <div className="flex items-center gap-3 text-blue-100 font-medium">
                {icon && <span>{icon}</span>}
                <span>{label}</span>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${checked ? 'bg-emerald-500/80' : 'bg-white/20'}`}
            >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
        </div>
    );
}

export function StatusChip({ status }: { status: 'ACTIVE' | 'SUSPENDED' | 'INVITED' | 'DELETED' }) {
    const map = {
        ACTIVE: 'from-emerald-500 to-green-600',
        SUSPENDED: 'from-rose-500 to-red-600',
        INVITED: 'from-amber-400 to-orange-500',
        DELETED: 'from-gray-500 to-slate-600',
    } as const;
    return (
        <span className={`inline-block rounded-lg bg-gradient-to-r ${map[status]} px-2.5 py-1 text-xs font-bold text-white shadow`}>
            {status}
        </span>
    );
}

export function RoleChip({ role }: { role: 'SYS_ADMIN' | 'SYS_SUPPORT' | 'STANDARD' }) {
    const map = {
        SYS_ADMIN: 'from-indigo-500 to-purple-600',
        SYS_SUPPORT: 'from-sky-500 to-blue-600',
        STANDARD: 'from-gray-400 to-gray-600',
    } as const;
    return (
        <span className={`inline-block rounded-lg bg-gradient-to-r ${map[role]} px-2.5 py-1 text-xs font-bold text-white shadow`}>
            {role}
        </span>
    );
}

export function Avatar({ seed }: { seed: string }) {
    const letter = (seed?.[0] || '?').toUpperCase();
    return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 font-bold">
            {letter}
        </div>
    );
}

export function Th({ children, className = '' }: any) {
    return <th className={`px-4 py-3 ${className}`}>{children}</th>;
}
export function Td({ children, className = '' }: any) {
    return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

export function ShieldIcon(props: any) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5-3.5 9-7 9s-7-4-7-9V7l7-4z" />
        </svg>
    );
}
export function SearchIcon(props: any) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
            <circle cx="11" cy="11" r="7" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
