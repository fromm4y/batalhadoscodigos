import { Link } from 'react-router';
import { GameLogo, HalftoneBackground, SpeechBubble } from '@/components/comic';
import { Dust, Lasers, MuseumFacade, Spotlights } from '@/components/scene';

/** Capa provisória. A tela de entrada com código chega na Etapa 2. */
export function HomePage() {
  return (
    <HalftoneBackground>
      <MuseumFacade className="absolute inset-x-0 bottom-0 h-[55vh] w-full opacity-70" />
      <Spotlights />
      <Lasers lasers={[{ top: '78%', angle: 2 }]} />
      <Dust />
      <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-10 p-8">
        <GameLogo />
        <SpeechBubble who="narradora" tail="center" delay={0.6}>
          A Narradora ainda não deu o sinal... Em breve, aqui você vai digitar o código da sessão!
        </SpeechBubble>
        <div className="flex gap-6">
          <Link
            to="/prototipo"
            className="border-4 border-ink bg-brass px-5 pt-2 pb-1 font-heist text-3xl tracking-wider text-ink shadow-comic glow-brass"
          >
            Protótipo das telas →
          </Link>
          <Link
            to="/teste-hq"
            className="border-4 border-ink bg-graphite-light px-5 pt-2 pb-1 font-heist text-3xl tracking-wider text-paper shadow-comic"
          >
            Kit visual
          </Link>
        </div>
      </main>
    </HalftoneBackground>
  );
}
