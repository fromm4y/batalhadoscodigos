import { motion } from 'framer-motion';
import { Onomatopoeia } from '@/components/comic';

/** Interferência: tela "chiando" por alguns segundos (overlay de prioridade alta, SPEC 9.2 item 7). */
export function InterferenceOverlay({ secondsLeft }: { secondsLeft: number }) {
  return (
    <motion.div
      role="alert"
      aria-live="assertive"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/80"
    >
      <div
        aria-hidden
        className="absolute inset-0 animate-glitch opacity-60 bg-[repeating-linear-gradient(0deg,rgb(255_255_255/0.12)_0_1px,transparent_1px_3px),repeating-linear-gradient(90deg,rgb(139_92_246/0.15)_0_2px,transparent_2px_5px)]"
      />
      <div className="relative flex flex-col items-center gap-4 text-center">
        <Onomatopoeia kind="zzzt" size={260} />
        <p className="font-heist text-4xl tracking-wider text-paper">
          O Bando interferiu no sinal!
        </p>
        <p className="font-type text-2xl text-mist">Voltando em {secondsLeft} s...</p>
      </div>
    </motion.div>
  );
}
