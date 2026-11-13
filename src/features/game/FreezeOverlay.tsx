import { motion } from 'framer-motion';

/** RN-46: "TODOS OS OLHOS NA NARRADORA!" cobre todas as telas até ela descongelar. */
export function FreezeOverlay({ message }: { message?: string }) {
  return (
    <motion.div
      role="alertdialog"
      aria-modal="true"
      aria-label="Todos os olhos na Narradora"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] grid place-items-center bg-black/90"
    >
      <motion.div
        aria-hidden
        className="absolute top-0 left-1/2 h-full w-[40rem] -translate-x-1/2"
        style={{
          background:
            'conic-gradient(from 0deg at 50% 0%, transparent 160deg, rgb(255 244 194 / 0.25) 175deg, rgb(255 244 194 / 0.25) 185deg, transparent 200deg)',
        }}
      />
      <motion.div
        initial={{ scale: 0.6, rotate: -6 }}
        animate={{ scale: 1, rotate: -2 }}
        transition={{ type: 'spring', stiffness: 220, damping: 12 }}
        className="relative rounded-hand border-8 border-ink bg-brass px-16 py-12 text-center shadow-[14px_14px_0_#000]"
      >
        <p className="font-comic text-7xl leading-none tracking-wide text-ink">👀 TODOS OS OLHOS</p>
        <p className="font-comic text-7xl leading-none tracking-wide text-bando text-outline">
          NA NARRADORA!
        </p>
        {message && <p className="mt-4 font-type text-2xl text-ink">{message}</p>}
      </motion.div>
    </motion.div>
  );
}
