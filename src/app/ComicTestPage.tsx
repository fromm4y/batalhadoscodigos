import { useState } from 'react';
import { AvatarBuilder } from '@/components/avatar/AvatarBuilder';
import { DEFAULT_AVATAR } from '@/components/avatar/avatarOptions';
import { Link } from 'react-router';
import {
  ComicButton,
  ComicPanel,
  GameLogo,
  HalftoneBackground,
  ONOMATOPOEIA,
  Onomatopoeia,
  SpeechBubble,
  cn,
  type OnomatopoeiaKind,
} from '@/components/comic';
import {
  BrassFrame,
  Dossier,
  Dust,
  Lasers,
  RouteMap,
  Spotlights,
  Stamp,
  Typewriter,
} from '@/components/scene';

const PALETTE = [
  { name: 'Noite', hex: '#0B0D14', cls: 'bg-night' },
  { name: 'Grafite', hex: '#171B26', cls: 'bg-graphite' },
  { name: 'Grafite claro', hex: '#252B3A', cls: 'bg-graphite-light' },
  { name: 'Papel envelhecido', hex: '#EDE3CC', cls: 'bg-paper' },
  { name: 'Alarme (Bando)', hex: '#E63946', cls: 'bg-bando glow-red' },
  { name: 'Luar (Piratas)', hex: '#2F6BFF', cls: 'bg-piratas glow-blue' },
  { name: 'Latão', hex: '#D4A537', cls: 'bg-brass glow-brass' },
  { name: 'Holofote', hex: '#FFF4C2', cls: 'bg-spotlight' },
  { name: 'Sucesso', hex: '#2BB673', cls: 'bg-success' },
];

const KINDS = Object.keys(ONOMATOPOEIA) as Exclude<OnomatopoeiaKind, 'custom'>[];

/** Página de teste — pele "HQ Noir" (VISUAL.md §11). */
export function ComicTestPage() {
  const [kind, setKind] = useState<Exclude<OnomatopoeiaKind, 'custom'>>('boom');
  const [playKey, setPlayKey] = useState(0);
  const [hoverSide, setHoverSide] = useState<'red' | 'blue' | null>(null);
  const [opened, setOpened] = useState(1);
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);

  const play = (k: Exclude<OnomatopoeiaKind, 'custom'>) => {
    setKind(k);
    setPlayKey((n) => n + 1);
  };

  return (
    <HalftoneBackground>
      <Spotlights />
      <Dust />
      <main className="relative mx-auto grid max-w-6xl gap-10 p-8">
        <header className="flex items-center justify-between gap-6">
          <GameLogo size="md" />
          <div className="text-right">
            <Typewriter
              text="Arquivo de teste nº 0 — kit visual noir."
              className="text-lg text-paper"
            />
            <Link
              to="/prototipo"
              className="mt-2 inline-block font-heist text-2xl tracking-wider text-brass text-glow-brass underline underline-offset-4"
            >
              Abrir protótipo das telas →
            </Link>
          </div>
        </header>

        {/* Linha 1: dossiê confidencial + balões */}
        <div className="grid grid-cols-5 gap-8">
          <Dossier title="Dossiê: Máquina Analítica" className="col-span-3" rotate={-1}>
            <ul className="list-disc space-y-1 pl-5">
              <li>Projetada por Charles Babbage no século 19.</li>
              <li>Recebia instruções por cartões perfurados.</li>
              <li>Em 1843, Ada Lovelace publicou um algoritmo para ela.</li>
            </ul>
          </Dossier>
          <ComicPanel tone="graphite" tilt={1} className="col-span-2 flex flex-col gap-1 pt-6">
            <SpeechBubble who="professor" glitch tail="left">
              Transmissão chiando... os cartões são a chave.
            </SpeechBubble>
            <SpeechBubble who="robo" shout tail="right" delay={0.3} className="self-end">
              BIP BOP... CALCULANDO SUA DERROTA!
            </SpeechBubble>
          </ComicPanel>
        </div>

        {/* Linha 2: planta e carta náutica */}
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <h2 className="font-heist text-3xl tracking-wider text-bando text-glow-red">
              O PLANO · BANDO
            </h2>
            <RouteMap theme="bando" opened={opened} goalReached={opened > 3} />
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="font-heist text-3xl tracking-wider text-piratas text-glow-blue">
              O MAPA · PIRATAS
            </h2>
            <RouteMap theme="piratas" opened={opened} goalReached={opened > 3} />
          </div>
          <div className="col-span-2 flex items-center gap-4">
            <ComicButton variant="graphite" icon="⟲" onClick={() => setOpened(0)}>
              Zerar
            </ComicButton>
            <ComicButton
              variant="success"
              icon="🔓"
              onClick={() => setOpened((n) => Math.min(4, n + 1))}
            >
              Abrir próximo cadeado
            </ComicButton>
            <p className="font-type text-mist">
              A rota acende a cada cadeado aberto (vira a trilha de progresso).
            </p>
          </div>
        </div>

        {/* Linha 3: onomatopeias brilhando */}
        <ComicPanel caption="Onomatopeias" tone="night" className="pt-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <Lasers
              lasers={[
                { top: '30%', angle: 4 },
                { top: '78%', angle: -3, delay: 1 },
              ]}
            />
          </div>
          <div className="relative grid grid-cols-[1fr_320px] items-center gap-6">
            <div className="flex flex-wrap gap-3">
              {KINDS.map((k) => (
                <ComicButton
                  key={k}
                  variant={k === kind ? 'brass' : 'graphite'}
                  onClick={() => play(k)}
                  aria-pressed={k === kind}
                >
                  {ONOMATOPOEIA[k].text}
                </ComicButton>
              ))}
            </div>
            <div className="grid h-72 place-items-center">
              <Onomatopoeia kind={kind} playKey={playKey} size={260} />
            </div>
          </div>
        </ComicPanel>

        {/* Linha 4: BANDO/PIRATAS acendendo + vitrine + paleta */}
        <div className="grid grid-cols-2 gap-8">
          <div className="grid grid-cols-2 gap-4">
            {(['red', 'blue'] as const).map((s) => {
              const red = s === 'red';
              const lit = hoverSide === s;
              const dim = hoverSide !== null && !lit;
              return (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverSide(s)}
                  onMouseLeave={() => setHoverSide(null)}
                  onFocus={() => setHoverSide(s)}
                  onBlur={() => setHoverSide(null)}
                  className={cn(
                    'flex min-h-40 cursor-pointer flex-col items-center justify-center gap-1 rounded-hand border-4 border-ink transition-all duration-300',
                    red ? 'bg-halftone-red' : 'bg-halftone-blue',
                    lit && (red ? 'glow-red scale-105' : 'glow-blue scale-105'),
                    dim && 'opacity-40 brightness-50',
                  )}
                >
                  <span className="text-4xl" aria-hidden>
                    {red ? '🎭' : '⚓'}
                  </span>
                  <span
                    className={cn(
                      'font-heist text-5xl tracking-wider',
                      red ? 'text-glow-red' : 'text-glow-blue',
                    )}
                  >
                    {red ? 'BANDO' : 'PIRATAS'}
                  </span>
                </button>
              );
            })}
            <BrassFrame className="col-span-2 flex items-center justify-between gap-4">
              <div>
                <p className="font-heist text-3xl tracking-wider text-brass">VITRINE Nº 1</p>
                <p className="font-type text-paper">Máquina Analítica · 1843</p>
              </div>
              <Stamp text="CONFIDENCIAL" />
            </BrassFrame>
          </div>
          <ComicPanel caption="Paleta v2" tone="graphite" tilt={0.6} className="pt-8">
            <ul className="grid grid-cols-3 gap-3">
              {PALETTE.map((c) => (
                <li key={c.hex} className="border-[3px] border-ink bg-graphite-light">
                  <div className={`h-12 border-b-[3px] border-ink ${c.cls}`} />
                  <p className="px-2 pt-1 text-sm font-extrabold">{c.name}</p>
                  <p className="px-2 pb-1 font-mono text-xs text-mist">{c.hex}</p>
                </li>
              ))}
            </ul>
          </ComicPanel>
        </div>

        <ComicPanel caption="Criador de avatar" tone="graphite" className="pt-8">
          <AvatarBuilder value={avatar} onChange={setAvatar} />
        </ComicPanel>

        <footer className="pb-4 text-center">
          <Link to="/" className="font-type text-mist underline underline-offset-4">
            ← Voltar para a capa
          </Link>
        </footer>
      </main>
    </HalftoneBackground>
  );
}
