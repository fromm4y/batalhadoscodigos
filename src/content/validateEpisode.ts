/**
 * Valida um episódio (JSON) contra o formato de `types.ts`, em tempo de teste.
 * O TypeScript não confere o conteúdo de um JSON importado; este validador confere.
 * Devolve a lista de problemas (vazia = válido).
 */
import type { CardPowerId, ChallengeType } from './types';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isInt = (v: unknown): v is number => Number.isInteger(v);
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const LEVELS = ['A', 'B', 'C'] as const;
const CARD_POWERS: CardPowerId[] = [
  'freeHint',
  'freeHint2',
  'extraPull',
  'forgiveMiss',
  'lightningPlus',
];

const TYPES: ChallengeType[] = [
  'quiz',
  'riddle',
  'anagram',
  'punchCardRead',
  'punchCardWrite',
  'blockBuild',
  'blockDebug',
  'cipher',
  'wiring',
  'priority',
  'boardChoice',
  'gameTree',
];

function checkVariant(type: ChallengeType, v: Obj, at: string, err: (m: string) => void) {
  for (const k of ['prompt', 'hint1', 'hint2']) if (!isStr(v[k])) err(`${at}: falta ${k}`);
  const need = (cond: boolean, msg: string) => !cond && err(`${at}: ${msg}`);
  switch (type) {
    case 'quiz': {
      const qs = v.questions;
      need(Array.isArray(qs) && qs.length > 0, 'questions vazio');
      if (Array.isArray(qs))
        qs.forEach((q: unknown, i) => {
          const o = q as Obj;
          need(isStr(o.q) && isStrArr(o.options), `pergunta ${i + 1} incompleta`);
          need(
            isInt(o.correct) &&
              isStrArr(o.options) &&
              o.correct >= 0 &&
              o.correct < o.options.length,
            `pergunta ${i + 1}: correct fora das opções`,
          );
        });
      break;
    }
    case 'riddle':
      need(v.mode === 'choice' || v.mode === 'text', 'mode inválido');
      need(isStr(v.text) && isStrArr(v.accept), 'text/accept');
      if (v.mode === 'choice') need(isStrArr(v.options), 'choice sem options');
      break;
    case 'anagram':
      need(isStr(v.answer), 'answer');
      need(['perWordFirstFixed', 'perWord', 'whole'].includes(v.mode as string), 'mode');
      break;
    case 'punchCardRead':
    case 'punchCardWrite':
      need(isInt(v.rows) && isInt(v.spokenColumn), 'rows/spokenColumn');
      need(v.decode === 'digits' || v.decode === 'letters', 'decode');
      break;
    case 'blockBuild':
      need(
        Array.isArray(v.palette) && Array.isArray(v.target) && isInt(v.maxBlocks),
        'palette/target/maxBlocks',
      );
      need(v.livePreview === undefined || typeof v.livePreview === 'boolean', 'livePreview');
      break;
    case 'blockDebug':
      need(Array.isArray(v.program) && Array.isArray(v.target), 'program/target');
      need(['symbols', 'counts', 'both'].includes(v.editable as string), 'editable');
      need(v.livePreview === undefined || typeof v.livePreview === 'boolean', 'livePreview');
      break;
    case 'cipher': {
      const mode = v.mode as string;
      need(['decode', 'encode', 'crack', 'verify'].includes(mode), 'mode');
      need(isInt(v.shift) && v.shift >= 1 && v.shift <= 25, 'shift entre 1 e 25');
      need(v.wheel === 'preset' || v.wheel === 'free', 'wheel');
      if (mode === 'verify')
        need(
          isStrArr(v.options) && isInt(v.correct) && v.correct < (v.options as string[]).length,
          'verify: options/correct',
        );
      else need(isStr(v.text) && isStr(v.answer), 'text/answer');
      if (v.text !== undefined)
        need(/^[A-Z ]+$/.test(v.text as string), 'text só com A–Z e espaço');
      if (v.answer !== undefined)
        need(/^[A-Z ]+$/.test(v.answer as string), 'answer só com A–Z e espaço');
      break;
    }
    case 'wiring':
      need(v.mode === 'build' || v.mode === 'debug', 'mode');
      need(isInt(v.start) && isInt(v.target) && isInt(v.slots), 'start/target/slots');
      need(
        isStrArr(v.modules) && (v.modules as string[]).every((m) => /^[+\-x]\d+$/.test(m)),
        'modules ("+3", "x2", "-1")',
      );
      need(
        isStrArr(v.modules) && isInt(v.slots) && v.slots <= (v.modules as string[]).length,
        'slots > módulos',
      );
      if (v.mode === 'debug')
        need(isStrArr(v.chain) && (v.chain as string[]).length === v.slots, 'debug: chain');
      need(v.livePreview === undefined || typeof v.livePreview === 'boolean', 'livePreview');
      break;
    case 'priority': {
      need(
        Array.isArray(v.tasks) && (v.tasks as Obj[]).every((t) => isStr(t.id) && isStr(t.label)),
        'tasks',
      );
      if (v.mode === 'select') need(isStrArr(v.correct) && isInt(v.pick), 'select: correct/pick');
      else if (v.mode === 'budget')
        need(
          isInt(v.capacity) &&
            isInt(v.optimalValue) &&
            (v.tasks as Obj[]).every((t) => isInt(t.cost) && isInt(t.value)),
          'budget: capacity/optimalValue/cost/value',
        );
      else err(`${at}: mode`);
      need(v.livePreview === undefined || typeof v.livePreview === 'boolean', 'livePreview');
      break;
    }
    case 'boardChoice':
      need(typeof v.board === 'string' && /^[XO.]{9}$/.test(v.board), 'board com 9 casas');
      need(v.you === 'X' && isObj(v.spokenMove) && isInt(v.answer), 'you/spokenMove/answer');
      need(v.revealed === undefined || typeof v.revealed === 'boolean', 'revealed');
      need(v.livePreview === undefined || typeof v.livePreview === 'boolean', 'livePreview');
      break;
    case 'gameTree':
      need(v.depth === 2 || v.depth === 3, 'depth');
      need(isObj(v.tree) && isStr(v.answer) && v.answer in (v.tree as Obj), 'tree/answer');
      need(v.livePreview === undefined || typeof v.livePreview === 'boolean', 'livePreview');
      break;
  }
}

function checkChallenge(c: unknown, at: string, err: (m: string) => void, keys: Set<string>) {
  if (!isObj(c)) return err(`${at}: desafio inválido`);
  for (const k of ['key', 'title', 'leaderLine']) if (!isStr(c[k])) err(`${at}: falta ${k}`);
  if (isStr(c.key)) {
    if (keys.has(c.key)) err(`${at}: key repetida ${c.key}`);
    keys.add(c.key);
  }
  if (!TYPES.includes(c.type as ChallengeType))
    return err(`${at}: tipo desconhecido ${String(c.type)}`);
  if (!isObj(c.variants)) return err(`${at}: sem variants`);
  for (const lv of LEVELS) {
    const v = c.variants[lv];
    if (!isObj(v)) err(`${at}: falta o nível ${lv}`);
    else checkVariant(c.type as ChallengeType, v, `${at} nível ${lv}`, err);
  }
  // Etapa 2 (17/11): mesmo formato, key própria.
  if (c.stage2 !== undefined) {
    const s2 = c.stage2;
    checkChallenge(s2, `${at} etapa 2`, err, keys);
    if (isObj(s2) && isObj(s2.stage2)) err(`${at}: a etapa 2 não tem etapa 3`);
    // chave da cifra falada: a etapa 2 reaproveita a mesma chave (sem nova transmissão)
    if (isObj(s2) && s2.type === 'cipher' && isObj(s2.variants) && isObj(c.variants))
      for (const lv of LEVELS) {
        const a = c.variants[lv] as Obj | undefined;
        const b = s2.variants[lv] as Obj | undefined;
        if (b?.spokenKey === true && (a?.spokenKey !== true || a.shift !== b.shift))
          err(`${at} etapa 2 nível ${lv}: chave falada diferente da etapa 1`);
      }
    // painel do ENIAC: a etapa 2 com entrada falada usa a MESMA entrada da etapa 1
    if (isObj(s2) && s2.type === 'wiring' && isObj(s2.variants) && isObj(c.variants))
      for (const lv of LEVELS) {
        const a = c.variants[lv] as Obj | undefined;
        const b = s2.variants[lv] as Obj | undefined;
        if (b?.startSpoken === true && (a?.startSpoken !== true || a.start !== b.start))
          err(`${at} etapa 2 nível ${lv}: entrada falada diferente da etapa 1`);
      }
    // console da Apollo: a etapa 2 com quantidade falada usa a MESMA quantidade da etapa 1
    if (isObj(s2) && s2.type === 'priority' && isObj(s2.variants) && isObj(c.variants))
      for (const lv of LEVELS) {
        const a = c.variants[lv] as Obj | undefined;
        const b = s2.variants[lv] as Obj | undefined;
        if (b?.pickSpoken === true && (a?.pickSpoken !== true || a.pick !== b.pick))
          err(`${at} etapa 2 nível ${lv}: quantidade falada diferente da etapa 1`);
      }
    // jogo da velha da etapa 2: a jogada da máquina já aparece (sem nova transmissão)
    if (isObj(s2) && s2.type === 'boardChoice' && isObj(s2.variants))
      for (const lv of LEVELS) {
        const b = s2.variants[lv] as Obj | undefined;
        if (b && b.revealed !== true) err(`${at} etapa 2 nível ${lv}: use revealed true`);
      }
    // cartão da etapa 2 não pede outra pista falada (spokenColumn = -1)
    if (
      isObj(s2) &&
      (s2.type === 'punchCardRead' || s2.type === 'punchCardWrite') &&
      isObj(s2.variants)
    )
      for (const lv of LEVELS) {
        const b = s2.variants[lv] as Obj | undefined;
        if (b && b.spokenColumn !== -1) err(`${at} etapa 2 nível ${lv}: use spokenColumn -1`);
      }
  }
}

export function validateEpisode(e: unknown): string[] {
  const errors: string[] = [];
  const err = (m: string) => errors.push(m);
  if (!isObj(e)) return ['episódio não é um objeto'];
  for (const k of ['id', 'title']) if (!isStr(e[k])) err(`falta ${k}`);
  if (!isInt(e.number)) err('falta number');
  if (!isStrArr(e.dossier) || !isStrArr(e.curiosities)) err('dossier/curiosities');
  if (!isObj(e.invention)) err('falta invention');
  if (!isObj(e.teaser) || !isStr(e.teaser.line) || !isStr(e.teaser.art)) err('teaser {line, art}');
  if (!isStrArr(e.recapOfThis) || e.recapOfThis.length === 0) err('recapOfThis');
  const card = e.card;
  if (
    !isObj(card) ||
    !isStr(card.title) ||
    !isStr(card.year) ||
    !isStrArr(card.people) ||
    !isStrArr(card.facts) ||
    !isStr(card.art)
  )
    err('card {title, year, people, facts, art}');
  const power = isObj(card) ? card.power : undefined;
  if (
    !isObj(power) ||
    !CARD_POWERS.includes(power.id as CardPowerId) ||
    !isStr(power.name) ||
    !isStr(power.text)
  )
    err(`card.power {id (${CARD_POWERS.join('/')}), name, text}`);
  const cert = e.certificate;
  if (!isObj(cert) || !isStr(cert.skill) || !isStrArr(cert.learned) || cert.learned.length === 0)
    err('certificate {skill, learned[]}');
  if (!Array.isArray(e.reveal)) err('reveal');
  const ev = e.event;
  if (
    !isObj(ev) ||
    ev.type !== 'alarmTrueFalse' ||
    !Array.isArray(ev.items) ||
    !isInt(ev.secondsPerItem)
  )
    err('event');
  const ns = e.narratorScript;
  if (!isObj(ns) || !isObj(ns.spokenClues) || !isStr(ns.opening) || !isStr(ns.closing))
    err('narratorScript');

  const keys = new Set<string>();
  const intro = e.intro as Obj | undefined;
  if (e.mode === 'coop') {
    const coop = e.coop as Obj | undefined;
    if (!isObj(coop) || !Array.isArray(coop.locks) || coop.locks.length !== 3)
      err('coop: 3 cadeados');
    else {
      (coop.locks as unknown[]).forEach((c, i) =>
        checkChallenge(c, `coop cadeado ${i + 1}`, err, keys),
      );
      checkChallenge(coop.vault, 'coop Cofre', err, keys);
      if (coop.bonus !== undefined) checkChallenge(coop.bonus, 'coop missão bônus', err, keys);
    }
    if (!isObj(intro) || !isStr(intro.coop)) err('intro.coop');
  } else {
    if (e.mode !== undefined && e.mode !== 'versus') err(`mode inválido ${String(e.mode)}`);
    const sides = e.sides as Obj | undefined;
    for (const s of ['red', 'blue']) {
      const sd = sides?.[s] as Obj | undefined;
      if (!isObj(sd) || !Array.isArray(sd.locks) || sd.locks.length !== 3) {
        err(`${s}: 3 cadeados`);
        continue;
      }
      (sd.locks as unknown[]).forEach((c, i) =>
        checkChallenge(c, `${s} cadeado ${i + 1}`, err, keys),
      );
      checkChallenge(sd.vault, `${s} Cofre`, err, keys);
      if (sd.bonus !== undefined) checkChallenge(sd.bonus, `${s} missão bônus`, err, keys);
    }
    const hasBonus = (s: string) => isObj(sides?.[s]) && (sides?.[s] as Obj).bonus !== undefined;
    if (hasBonus('red') !== hasBonus('blue')) err('missão bônus: os dois lados ou nenhum');
    if (!isObj(intro) || !isStr(intro.red) || !isStr(intro.blue)) err('intro.red/blue');
  }
  // As pistas faladas apontam para desafios que existem.
  if (isObj(ns) && isObj(ns.spokenClues))
    for (const lv of LEVELS) {
      const list = ns.spokenClues[lv];
      if (!Array.isArray(list)) err(`spokenClues ${lv}`);
      else
        for (const c of list as Obj[])
          if (!keys.has(c.challengeKey as string))
            err(`pista falada aponta para ${String(c.challengeKey)}`);
    }
  return errors;
}
