import { Link } from 'react-router';
import { ComicPanel, HalftoneBackground, SpeechBubble } from '@/components/comic';

/** Placeholder estilizado para rotas que chegam nas próximas etapas. */
export function ComingSoon({ title, stage }: { title: string; stage: number }) {
  return (
    <HalftoneBackground>
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 p-8">
        <ComicPanel caption={`Etapa ${stage}`} tilt={-1} className="w-full text-center">
          <h1 className="font-comic text-5xl tracking-wider">{title}</h1>
        </ComicPanel>
        <SpeechBubble who="narradora" tail="center">
          Calma, equipe! Esta parte do museu ainda está em obras. 🚧
        </SpeechBubble>
        <Link to="/teste-hq" className="font-bold underline underline-offset-4">
          Ver a página de teste de HQ
        </Link>
      </main>
    </HalftoneBackground>
  );
}
