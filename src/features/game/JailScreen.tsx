import { motion } from 'framer-motion';
import { artUrl, SpeechBubble } from '@/components/comic';
import { serverNow } from '@/lib/serverClock';
import { useNow } from '@/lib/useNow';

/** RN-35: prisão de 60 s depois de errar o alarme, com uma curiosidade do episódio. */
export function JailScreen({ untilMs, curiosities }: { untilMs: number; curiosities: string[] }) {
  useNow(500);
  const left = Math.max(0, Math.ceil((untilMs - serverNow()) / 1000));
  // curiosidade escolhida pelo horário da prisão (estável enquanto a tela está aberta)
  const tip = curiosities[Math.floor(untilMs / 1000) % Math.max(1, curiosities.length)] ?? '';
  return (
    <motion.div
      role="alertdialog"
      aria-modal="true"
      aria-label="Vocês foram presos por um tempinho"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-night"
    >
      {artUrl('cela-prisao') && (
        <img
          src={artUrl('cela-prisao')}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
      )}
      {/* grades */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_70px,rgb(10_10_10/0.85)_70px_84px)]"
      />
      <div className="relative flex max-w-2xl flex-col items-center gap-6 text-center">
        <p className="font-heist text-6xl tracking-[0.12em] text-paper text-glow-spot">
          PRESOS POR {left} s
        </p>
        <p className="font-type text-xl text-mist">
          O alarme era pegadinha... Aproveitem para aprender algo novo:
        </p>
        <SpeechBubble who="narradora" tail="center" className="max-w-xl">
          <span className="mb-1 block font-type text-sm uppercase">Você sabia?</span>
          {tip}
        </SpeechBubble>
        <p className="font-type text-mist">Depois vocês voltam para o desafio de onde pararam.</p>
      </div>
    </motion.div>
  );
}
