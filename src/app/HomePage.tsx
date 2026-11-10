import { Link } from 'react-router';
import { ComicPanel, GameLogo, HalftoneBackground, SpeechBubble } from '@/components/comic';

/** Capa provisória. A tela de entrada com código chega na Etapa 2. */
export function HomePage() {
  return (
    <HalftoneBackground rays tone="gold">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-10 p-8">
        <GameLogo />
        <ComicPanel tilt={1} delay={0.2} className="max-w-xl text-center">
          <p className="text-xl font-extrabold">
            O Museu Nacional da Tecnologia está prestes a abrir... 🏛️
          </p>
        </ComicPanel>
        <SpeechBubble who="narradora" tail="center" delay={0.4}>
          A Narradora ainda não deu o sinal... Em breve, aqui você vai digitar o código da sessão!
        </SpeechBubble>
        <Link
          to="/teste-hq"
          className="border-4 border-ink bg-ink px-5 py-3 font-comic text-2xl tracking-wider text-paper shadow-comic"
        >
          Página de teste de HQ →
        </Link>
      </main>
    </HalftoneBackground>
  );
}
