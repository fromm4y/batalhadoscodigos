import { motion } from 'framer-motion';

/** RN-45: balão gigante "TIRE O FONE!" em todas as telas enquanto a Narradora fala. */
export function TransmissionOverlay() {
  return (
    <motion.div
      role="alertdialog"
      aria-live="assertive"
      aria-label="Transmissão da Narradora: tire o fone e escute"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] grid place-items-center bg-black/85"
    >
      <div
        className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgb(255_255_255/0.04)_0_2px,transparent_2px_4px)]"
        aria-hidden
      />
      <motion.div
        initial={{ scale: 0.3, rotate: -8 }}
        animate={{ scale: 1, rotate: -3 }}
        transition={{ type: 'spring', stiffness: 260, damping: 12 }}
        className="relative rounded-[50%/45%] border-8 border-ink bg-aged px-20 py-14 text-center shadow-[14px_14px_0_#000]"
      >
        <p className="font-comic text-8xl leading-none tracking-wide text-bando text-outline-thick">
          TIRE O FONE! 🎧
        </p>
        <p className="mt-4 font-type text-2xl text-ink">
          A Narradora vai falar uma pista importante...
        </p>
      </motion.div>
    </motion.div>
  );
}
