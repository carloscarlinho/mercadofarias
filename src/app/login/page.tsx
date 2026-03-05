'use client';

import { useState } from 'react';
import { login } from '@/lib/auth';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        try {
            const response = await login(formData);
            if (response?.error) {
                setError(response.error);
                setLoading(false);
            }
        } catch {
            setError('Ocorreu um erro ao tentar entrar. Tente novamente.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-slate-100">

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#0ea5e9]/10 text-[#0ea5e9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-4xl">storefront</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Bem-vindo ao G.M.C</h1>
                    <p className="text-[#64748b] mt-2">Faça login para acessar o sistema.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">error</span>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-semibold text-[#0f172a] mb-1.5 block">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94a3b8]">
                                <span className="material-symbols-outlined text-[20px]">mail</span>
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                                className="w-full pl-11 pr-4 py-3.5 bg-[#f8fafc] border-none rounded-xl text-[#0f172a] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#0ea5e9] text-base transition-all"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-[#0f172a] mb-1.5 block">Senha</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94a3b8]">
                                <span className="material-symbols-outlined text-[20px]">lock</span>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                                className="w-full pl-11 pr-4 py-3.5 bg-[#f8fafc] border-none rounded-xl text-[#0f172a] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#0ea5e9] text-base transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] disabled:bg-[#94a3b8] text-white rounded-xl py-3.5 font-bold text-base shadow-md shadow-sky-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? (
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined">login</span>
                        )}
                        {loading ? 'Acessando...' : 'Entrar'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-[#94a3b8]">
                    G.M.C - Gestão de Mercadorias e Clientes &copy; {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
}
