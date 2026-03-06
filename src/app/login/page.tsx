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
        <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#0c1425] to-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background glow effects */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0ea5e9]/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#f59e0b]/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Logo - Grande e Impactante */}
            <div className="mb-6 animate-[fadeInDown_0.8s_ease-out]">
                <img
                    src="/logo.png"
                    alt="Mercado Farias"
                    className="w-52 h-52 sm:w-64 sm:h-64 object-contain drop-shadow-[0_0_40px_rgba(14,165,233,0.3)] mx-auto"
                />
            </div>

            {/* Card de Login */}
            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-black/20 border border-white/20 animate-[fadeInUp_0.6s_ease-out_0.3s_both]">

                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Bem-vindo ao G.M.C</h1>
                    <p className="text-[#64748b] mt-1 text-sm">Gestão de Mercadorias e Clientes</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        className="w-full bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] disabled:from-[#94a3b8] disabled:to-[#94a3b8] text-white rounded-xl py-3.5 font-bold text-base shadow-lg shadow-sky-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? (
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined">login</span>
                        )}
                        {loading ? 'Acessando...' : 'Entrar'}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-[#94a3b8]">
                    G.M.C &copy; {new Date().getFullYear()} &middot; Todos os direitos reservados
                </div>
            </div>
        </div>
    );
}
