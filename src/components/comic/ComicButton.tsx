import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from './cn';

export type ButtonVariant = 'red' | 'blue' | 'gold' | 'ink' | 'paper' | 'success';
export type ButtonSize = 'md' | 'lg' | 'xl';

const variantClass: Record<ButtonVariant, string> = {
  red: 'bg-bando text-white',
  blue: 'bg-piratas text-white',
  gold: 'bg-gold text-ink',
  ink: 'bg-ink text-paper',
  paper: 'bg-paper text-ink',
  success: 'bg-success text-white',
};

const sizeClass: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 text-xl',
  lg: 'min-h-14 px-7 text-2xl',
  xl: 'min-h-20 px-10 text-4xl',
};

type ComicButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ícone à esquerda: botões nunca dependem só de cor (SPEC 9.6). */
  icon?: ReactNode;
};

/** Botão de HQ: Bangers, borda grossa, sombra chapada e "afunda" ao clicar. Altura mínima 44 px. */
export function ComicButton({
  children,
  variant = 'gold',
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
      whileTap={disabled ? undefined : { scale: 0.96, x: 3, y: 3, boxShadow: '0px 0px 0 0 #111' }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 border-4 border-ink rounded-hand-alt font-comic tracking-wider shadow-comic',
        'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-50',
        variantClass[variant],
        sizeClass[size],
        variant === 'red' || variant === 'blue' || variant === 'success' || variant === 'ink'
          ? 'text-outline'
          : '',
        className,
      )}
      {...rest}
    >
      {icon && (
        <span aria-hidden className="text-[0.9em] [-webkit-text-stroke:0]">
          {icon}
        </span>
      )}
      {children}
    </motion.button>
  );
}
