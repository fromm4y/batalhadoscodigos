import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { playSfx } from '@/audio/engine';
import { ComicArt, ComicButton, GameLogo } from '@/components/comic';
import { Dust, FlashlightReveal, MuseumFacade, Typewriter } from '@/components/scene';

/**
 * Abertura (pedido da May, a partir do protótipo 8.1): o museu no escuro, a lanterna segue o
 * mouse, e "COMEÇAR" leva para a tela do código da sala.
 */
export function SplashScreen({ onStart }: { onStart: () => void }) {
  const [ready, setReady] = useState(false);
  return (
    <div className="relative h-screen overflow-hidden bg-black">
      <FlashlightReveal className="h-full cursor-none" radius={220}>
        <ComicArt
          id="capa-entrada"
          alt="Fachada do museu à noite"
          fallback={<MuseumFacade className="h-full w-full" />}
        />
      </FlashlightReveal>
      <Dust count={10} />
      <div className="pointer-events-none absolute inset-x-0 top-10 flex flex-col items-center gap-3 text-center">
        <Typewriter
          text="Museu Nacional da Tecnologia. 23h58."
          delay={400}
          speed={65}
          onDone={() => setReady(true)}
          className="pointer-events-auto text-3xl text-paper text-glow-spot"
        />
        <p className="font-type text-lg text-mist">🔦 Mexa o mouse para iluminar o museu...</p>
      </div>
      <AnimatePresence>
        {ready && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 14 }}
            className="absolute inset-x-0 bottom-12 flex flex-col items-center gap-6"
          >
            <GameLogo />
            <ComicButton
              variant="brass"
              size="xl"
              icon="▶"
              autoFocus
              onClick={() => {
                playSfx('whoosh');
                onStart();
              }}
            >
              Começar
            </ComicButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
