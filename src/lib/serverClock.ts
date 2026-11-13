/**
 * Relógio do servidor (SPEC 5.2): o computador da escola pode estar com a hora errada.
 * Estimamos o offset comparando um `serverTimestamp()` gravado com a hora local do envio.
 */
let offsetMs = 0;
let calibrated = false;

/** Registra uma amostra: hora local do envio/recebimento e a hora que o servidor gravou. */
export function calibrate(localSentAt: number, localReceivedAt: number, serverMs: number): void {
  const local = (localSentAt + localReceivedAt) / 2;
  const sample = serverMs - local;
  offsetMs = calibrated ? offsetMs * 0.7 + sample * 0.3 : sample;
  calibrated = true;
}

/** "Agora" no relógio do servidor (ms). */
export function serverNow(): number {
  return Date.now() + offsetMs;
}

export function clockOffset(): number {
  return offsetMs;
}
