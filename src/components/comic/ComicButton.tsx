import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from './cn';

export type ButtonVariant = 'red' | 'blue' | 'brass' | 'graphite' | 'paper' | 'success';
export type ButtonSize = 'md' | 'lg' | 'xl';

const variantClass: Record<ButtonVariant, string> = {
  red: 'bg-bando text-paper hover:glow-red',
  blue: 'bg-piratas text-paper hover:glow-blue',
  brass: 'bg-brass text-ink hover:glow-brass',
  graphite: 'bg-graphite-light text-paper',
  paper: 'bg-aged text-ink',
  success: 'bg-success text-paper',
};

const sizeClass: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 text-2xl',
  lg: 'min-h-14 px-7 text-3xl',
  xl: 'min-h-20 px-10 text-5xl',
};

type ComicButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ícone à esquerda: botões nunca dependem só de cor. */
  icon?: ReactNode;
};

/** Botão de assalto: Bebas Neue, borda grossa, sombra chapada, brilho no hover. Altura mínima 44 px. */
export function ComicButton({
  children,
  variant = 'brass',
  size = 'md',
  icon,
  className,
  disabled,
  type = 'button',
  ...rest
}: ComicButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.04, rotate: -1 }}
      whileTap={disabled ? undefined : { scale: 0.96, x: 3, y: 3, boxShadow: '0px 0px 0 0 #000' }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-hand-alt border-4 border-ink pt-1 font-heist tracking-wider shadow-comic transition-shadow',
        'cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-50',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...rest}
    >
      {icon && (
        <span aria-hidden className="-mt-1 text-[0.8em]">
          {icon}
        </span>
      )}
      {children}
    </motion.button>
  );
}
