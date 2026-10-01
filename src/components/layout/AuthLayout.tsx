import React from 'react';
import { Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  marketingTitle: React.ReactNode;
  marketingDesc: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, marketingTitle, marketingDesc }) => {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side: Auth Form */}
      <div className="w-full md:w-5/12 lg:w-4/12 flex flex-col justify-center px-4 sm:px-8 md:px-12 py-8 sm:py-12 bg-card border-b md:border-b-0 md:border-r z-10 relative">
        {children}
      </div>

      {/* Right Side: Marketing Visuals */}
      <div className="hidden md:flex md:w-7/12 lg:w-8/12 flex-col justify-center items-center relative overflow-hidden bg-zinc-950">
        <div className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-blue-500/10 blur-[80px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-indigo-500/10 blur-[80px]" />

        <div className="relative z-10 max-w-2xl text-center px-8">
          <div className="inline-flex p-4 mb-8 rounded-xl bg-zinc-900/50 backdrop-blur-xl border border-white/10 shadow-2xl">
            <Sparkles className="w-16 h-16 text-zinc-100" />
          </div>
          <h2 className="text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-[1.1] text-white">
            {marketingTitle}
          </h2>
          <p className="text-xl text-zinc-400 font-medium leading-relaxed max-w-xl mx-auto">
            {marketingDesc}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
