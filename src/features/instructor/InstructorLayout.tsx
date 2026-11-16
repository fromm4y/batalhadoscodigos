import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { HalftoneBackground, cn } from '@/components/comic';
import { useAuthStore, useProfile } from './auth/authStore';

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'min-h-11 border-[3px] border-ink px-4 pt-2 font-heist text-xl tracking-wider',
    isActive ? 'bg-brass text-ink glow-brass' : 'bg-graphite-light text-paper hover:bg-night',
  );

/** Moldura das telas da Narradora: barra com navegação e saída. */
export function InstructorLayout({ title, children }: { title: string; children: ReactNode }) {
  const profile = useProfile();
  const signOut = useAuthStore((s) => s.signOut);
  return (
    <HalftoneBackground>
      <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b-4 border-ink bg-graphite px-3 py-2 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="font-comic text-3xl text-bando text-glow-red">CAÇADA</span>
          <span className="hidden font-type text-sm text-mist sm:inline">sala de controle</span>
        </div>
        <nav aria-label="Navegação da Narradora" className="flex gap-2">
          <NavLink to="/instrutor/turmas" className={navClass}>
            🗂️ Turmas
          </NavLink>
          {profile?.role === 'admin' && (
            <NavLink to="/admin" className={navClass}>
              🗝️ Admin
            </NavLink>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-right text-sm leading-tight sm:block">
            <span className="block font-bold text-paper">{profile?.displayName}</span>
            <span className="block text-mist">
              {profile?.role === 'admin' ? 'Administradora' : 'Narradora'}
            </span>
          </span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="min-h-11 cursor-pointer border-2 border-mist/50 px-3 pt-1 font-heist text-lg tracking-wider text-mist hover:border-paper hover:text-paper"
          >
            Sair
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        <h1 className="mb-6 font-heist text-4xl tracking-[0.1em] text-paper text-glow-spot sm:text-5xl">
          {title}
        </h1>
        {children}
      </main>
    </HalftoneBackground>
  );
}
