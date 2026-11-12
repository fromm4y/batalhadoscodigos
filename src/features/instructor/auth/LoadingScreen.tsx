import { HalftoneBackground } from '@/components/comic';
import { Typewriter } from '@/components/scene';

export function LoadingScreen({ text = 'Verificando credenciais...' }: { text?: string }) {
  return (
    <HalftoneBackground>
      <div className="grid min-h-screen place-items-center" role="status" aria-live="polite">
        <Typewriter text={text} speed={35} className="text-2xl text-paper text-glow-spot" />
      </div>
    </HalftoneBackground>
  );
}
