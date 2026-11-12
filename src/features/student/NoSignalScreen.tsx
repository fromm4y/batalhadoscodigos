import { Link } from 'react-router';
import { HalftoneBackground, SpeechBubble } from '@/components/comic';
import { Dust, Lasers, Spotlights, Typewriter } from '@/components/scene';

/** RN-06: fora de uma sessão aberta, qualquer acesso de aluno cai aqui. */
export function NoSignalScreen({ detail }: { detail?: string }) {
  return (
    <HalftoneBackground>
      <Spotlights intensity={0.1} />
      <Lasers />
      <Dust />
      <main className="relative grid min-h-screen place-items-center p-8">
        <div className="flex max-w-2xl flex-col items-center gap-8 text-center">
          <span className="text-7xl" aria-hidden>
            📡
          </span>
          <Typewriter
            text="A Narradora ainda não deu o sinal..."
            speed={60}
            className="text-4xl text-paper text-glow-spot"
          />
          <SpeechBubble who="narradora" tail="center" delay={0.4}>
            {detail ?? 'Fiquem de olho no projetor: quando a aula começar, o código aparece lá!'}
          </SpeechBubble>
          <Link
            to="/"
            className="min-h-11 border-4 border-ink bg-brass px-6 pt-2 pb-1 font-heist text-3xl tracking-wider text-ink shadow-comic"
          >
            Digitar o código
          </Link>
        </div>
      </main>
    </HalftoneBackground>
  );
}
