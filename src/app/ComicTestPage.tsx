import { useState } from 'react';
import { Link } from 'react-router';
import {
  ComicArt,
  ComicButton,
  ComicPanel,
  GameLogo,
  HalftoneBackground,
  ONOMATOPOEIA,
  Onomatopoeia,
  SpeechBubble,
  type OnomatopoeiaKind,
} from '@/components/comic';

const PALETTE = [
  { name: 'Papel', hex: '#FFF8E7', cls: 'bg-paper' },
  { name: 'Tinta', hex: '#111111', cls: 'bg-ink' },
  { name: 'Bando', hex: '#E63946', cls: 'bg-bando' },
  { name: 'Bando sombra', hex: '#9D0208', cls: 'bg-bando-dark' },
  { name: 'Piratas', hex: '#1D4ED8', cls: 'bg-piratas' },
  { name: 'Piratas sombra', hex: '#0B2A7A', cls: 'bg-piratas-dark' },
  { name: 'Palha/ouro', hex: '#F4C430', cls: 'bg-gold' },
  { name: 'Sucesso', hex: '#2BB673', cls: 'bg-success' },
  { name: 'Alerta', hex: '#FF8C00', cls: 'bg-alert' },
];

const KINDS = Object.keys(ONOMATOPOEIA) as Exclude<OnomatopoeiaKind, 'custom'>[];

/** Página de teste da Etapa 0: kit visual de HQ (aceite: quadro + balão + onomatopeia animada). */
export function ComicTestPage() {
  const [kind, setKind] = useState<Exclude<OnomatopoeiaKind, 'custom'>>('boom');
  const [playKey, setPlayKey] = useState(0);

  const play = (k: Exclude<OnomatopoeiaKind, 'custom'>) => {
    setKind(k);
    setPlayKey((n) => n + 1);
  };

  return (
    <HalftoneBackground>
      <main className="mx-auto grid max-w-6xl gap-8 p-8">
        <header className="flex items-center justify-between gap-6">
          <GameLogo size="md" />
          <ComicPanel tone="ink" tilt={1} className="max-w-sm">
            <p className="font-comic text-3xl tracking-wider text-gold">Página de teste</p>
            <p className="font-semibold">Kit visual de HQ — Etapa 0</p>
          </ComicPanel>
        </header>

        {/* Linha 1: quadros da abertura do episódio */}
        <div className="grid grid-cols-5 gap-6">
          <ComicPanel
            caption="Museu Nacional da Tecnologia. Meia-noite."
            tone="halftone"
            tilt={-1}
            className="col-span-3 flex flex-col gap-4 pt-8"
          >
            <div className="h-44 overflow-hidden border-4 border-ink">
              <ComicArt id="museu-noite" alt="O museu à noite" />
            </div>
            <SpeechBubble who="professor" tail="right" delay={0.3} className="self-end">
              O segredo dessa máquina está nos cartões. Peguem os cartões e a vitrine é nossa.
            </SpeechBubble>
          </ComicPanel>

          <ComicPanel
            tone="blue"
            tilt={1}
            delay={0.15}
            className="col-span-2 flex flex-col justify-between gap-4"
          >
            <div className="h-32 overflow-hidden border-4 border-ink">
              <ComicArt id="capita-navio" alt="A Capitã no navio" />
            </div>
            <SpeechBubble who="capita" tail="left" delay={0.45} className="text-ink">
              Esse é o tesouro que ensinou o mundo a programar. Ninguém encosta nele!
            </SpeechBubble>
          </ComicPanel>
        </div>

        {/* Linha 2: onomatopeias */}
        <ComicPanel caption="Onomatopeias" tone="paper" tilt={0.5} delay={0.25} className="pt-8">
          <div className="grid grid-cols-[1fr_320px] items-center gap-6">
            <div className="flex flex-wrap gap-3">
              {KINDS.map((k) => (
                <ComicButton
                  key={k}
                  variant={k === kind ? 'ink' : 'gold'}
                  onClick={() => play(k)}
                  aria-pressed={k === kind}
                >
                  {ONOMATOPOEIA[k].text}
                </ComicButton>
              ))}
              <p className="w-full font-semibold">
                Clique para estourar de novo. Com "reduzir movimento" ligado no sistema, as
                animações ficam suaves.
              </p>
            </div>
            <div className="grid h-72 place-items-center">
              <Onomatopoeia kind={kind} playKey={playKey} size={260} />
            </div>
          </div>
        </ComicPanel>

        {/* Linha 3: balões, botões e paleta */}
        <div className="grid grid-cols-2 gap-6">
          <ComicPanel
            caption="Balões e botões"
            tilt={-0.5}
            delay={0.35}
            className="flex flex-col gap-6 pt-8"
          >
            <div className="flex flex-col gap-2">
              <SpeechBubble who="robo" shout tail="left" delay={0.5}>
                BIP BOP... CALCULANDO SUA DERROTA!
              </SpeechBubble>
              <SpeechBubble who="narradora" tail="right" delay={0.65} className="self-end">
                Todos os olhos em mim, equipes!
              </SpeechBubble>
            </div>
            <div className="flex flex-wrap gap-3">
              <ComicButton variant="red" icon="🎭">
                Bando
              </ComicButton>
              <ComicButton variant="blue" icon="⚓">
                Piratas
              </ComicButton>
              <ComicButton variant="success" icon="✔">
                Enviar
              </ComicButton>
              <ComicButton variant="paper" icon="💡">
                Dica 1
              </ComicButton>
              <ComicButton variant="gold" disabled icon="⏳">
                Aguarde
              </ComicButton>
            </div>
            <ComicButton size="xl" variant="gold" icon="⚡" onClick={() => play('boom')}>
              ENTRAR!
            </ComicButton>
          </ComicPanel>

          <ComicPanel caption="Paleta" tone="paper" tilt={0.8} delay={0.45} className="pt-8">
            <ul className="grid grid-cols-3 gap-3">
              {PALETTE.map((c) => (
                <li key={c.hex} className="border-[3px] border-ink bg-white shadow-comic-sm">
                  <div className={`h-14 border-b-[3px] border-ink ${c.cls}`} />
                  <p className="px-2 pt-1 text-sm font-extrabold">{c.name}</p>
                  <p className="px-2 pb-1 font-mono text-xs">{c.hex}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="grid h-20 place-items-center border-4 border-ink bg-halftone-red font-comic text-3xl text-white text-outline">
                BANDO
              </div>
              <div className="grid h-20 place-items-center border-4 border-ink bg-halftone-blue font-comic text-3xl text-white text-outline">
                PIRATAS
              </div>
            </div>
          </ComicPanel>
        </div>

        <footer className="pb-4 text-center font-bold">
          <Link to="/" className="underline underline-offset-4">
            ← Voltar para a capa
          </Link>
        </footer>
      </main>
    </HalftoneBackground>
  );
}
