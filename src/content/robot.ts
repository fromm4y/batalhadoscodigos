/** Falas do Robô (RN-44): provocações engraçadas, nunca humilhantes. */
export const ROBOT_TAUNTS = {
  start: ['Bip bop... calculando sua derrota.', 'Meus circuitos estão aquecidos. E os seus?'],
  lock: [
    'Cadeado aberto em 0,3 nanossegundo. Brincadeira, demorei mais.',
    'Bip! Mais um! Vocês ainda estão lendo o enunciado?',
    'Processando... processando... ABERTO!',
    'Minha bateria está em 100%. E a paciência de vocês?',
    'Mais um cadeado para a minha coleção. Bip bip!',
    'Calculei 42 caminhos. Escolhi o mais rápido. 🤖',
  ],
  ability: [
    'Ativando truque secreto. Bip!',
    'Ops, apertei um botão sem querer. Ou não. 😏',
    'Modo turbo: LIGADO. Bzzzt!',
  ],
  vault: ['COFRE ABERTO! Os robôs dominarão os museus!'],
  lose: ['Erro 404: vitória não encontrada... 😵'],
} as const;

export function pickTaunt(
  kind: keyof typeof ROBOT_TAUNTS,
  rand: () => number = Math.random,
): string {
  const list = ROBOT_TAUNTS[kind];
  return list[Math.floor(rand() * list.length)]!;
}
