import { AnimatePresence, motion } from 'framer-motion';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { ComicButton, cn } from '@/components/comic';
import { levelFromGrade } from '@/config/gameRules';
import { seasonFromDate } from '@/content/season';
import { getFirebase } from '@/lib/firebase';
import type { ClassDoc, Level, Shift } from '@/types/domain';
import type { WithId } from '../data';
import {
  CLASS_NAME_MAX,
  EMPTY_CLASS_FORM,
  GRADES,
  LEVELS,
  effectiveLevel,
  toClassFields,
  validateClassForm,
  type ClassFormErrors,
  type ClassFormValues,
} from './classForm';

type Props = {
  open: boolean;
  onClose: () => void;
  uid: string;
  schools: { id: string; name: string; active: boolean }[];
  /** turma em edição; ausente = nova turma */
  editing?: WithId<ClassDoc> | null;
};

const LEVEL_HINT: Record<Level, string> = { A: '4º–5º ano', B: '6º–7º ano', C: '8º–9º ano' };

function chip(selected: boolean) {
  return cn(
    'min-h-11 min-w-11 cursor-pointer border-[3px] border-ink px-3 pt-1 font-heist text-xl tracking-wider',
    selected ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-brass',
  );
}

function initialValues(editing?: WithId<ClassDoc> | null): ClassFormValues {
  if (!editing) return EMPTY_CLASS_FORM;
  return {
    schoolId: editing.schoolId,
    name: editing.name,
    grade: editing.grade,
    shift: editing.shift,
    levelOverride: editing.level !== levelFromGrade(editing.grade) ? editing.level : null,
  };
}

/** Criar/editar turma (RN-01). Nível derivado da série, com ajuste manual. */
export function ClassFormDialog(props: Props) {
  const { open, onClose, editing } = props;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          {/* `key` recria o formulário (e o estado) a cada abertura */}
          <ClassForm key={editing?.id ?? 'nova'} {...props} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ClassForm({ onClose, uid, schools, editing }: Props) {
  const [values, setValues] = useState<ClassFormValues>(() => initialValues(editing));
  const [errors, setErrors] = useState<ClassFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const firstField = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const t = setTimeout(() => firstField.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const level = effectiveLevel(values);
  const activeSchools = schools.filter((s) => s.active || s.id === editing?.schoolId);

  async function save() {
    const errs = validateClassForm(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { db } = getFirebase();
      const fields = toClassFields(values);
      if (editing) {
        await updateDoc(doc(db, 'classes', editing.id), fields);
      } else {
        await addDoc(collection(db, 'classes'), {
          ...fields,
          instructorId: uid,
          season: seasonFromDate(new Date()),
          archived: false,
          createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (err) {
      console.error('[turma]', err);
      setSaveError('Não consegui salvar. Confira os campos e tente de novo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="class-dialog-title"
      initial={{ y: 40, rotate: -2, opacity: 0 }}
      animate={{ y: 0, rotate: -0.5, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="w-full max-w-2xl rounded-sm border-[3px] border-ink bg-aged p-7 text-ink shadow-comic"
    >
      <h2
        id="class-dialog-title"
        className="mb-5 border-b-2 border-dashed border-ink/50 pb-2 font-type text-2xl uppercase"
      >
        {editing ? 'Editar turma' : 'Nova turma'}
      </h2>
      <form
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        noValidate
      >
        <label className="grid gap-1">
          <span className="font-type text-sm uppercase">Escola</span>
          <select
            ref={firstField}
            value={values.schoolId}
            onChange={(e) => setValues((v) => ({ ...v, schoolId: e.target.value }))}
            aria-invalid={!!errors.schoolId}
            className="min-h-11 border-[3px] border-ink bg-paper px-3 font-body text-lg font-bold"
          >
            <option value="">Escolha...</option>
            {activeSchools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.schoolId && (
            <span className="text-sm font-bold text-bando-dark">{errors.schoolId}</span>
          )}
        </label>

        <fieldset className="grid gap-1">
          <legend className="mb-1 font-type text-sm uppercase">Série</legend>
          <div className="flex flex-wrap gap-2">
            {GRADES.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={values.grade === g}
                onClick={() => setValues((v) => ({ ...v, grade: g }))}
                className={chip(values.grade === g)}
              >
                {g}º
              </button>
            ))}
          </div>
          {errors.grade && (
            <span className="text-sm font-bold text-bando-dark">{errors.grade}</span>
          )}
        </fieldset>

        <div className="grid grid-cols-[1fr_auto] gap-5">
          <label className="grid gap-1">
            <span className="font-type text-sm uppercase">Nome da turma</span>
            <input
              value={values.name}
              maxLength={CLASS_NAME_MAX}
              placeholder="ex.: 6º A"
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              aria-invalid={!!errors.name}
              className="min-h-11 border-[3px] border-ink bg-paper px-3 font-body text-lg font-bold"
            />
            {errors.name && (
              <span className="text-sm font-bold text-bando-dark">{errors.name}</span>
            )}
          </label>
          <fieldset className="grid gap-1">
            <legend className="mb-1 font-type text-sm uppercase">Turno</legend>
            <div className="flex gap-2">
              {(['manha', 'tarde'] as Shift[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={values.shift === s}
                  onClick={() => setValues((v) => ({ ...v, shift: s }))}
                  className={chip(values.shift === s)}
                >
                  {s === 'manha' ? '☀️ Manhã' : '🌇 Tarde'}
                </button>
              ))}
            </div>
            {errors.shift && (
              <span className="text-sm font-bold text-bando-dark">{errors.shift}</span>
            )}
          </fieldset>
        </div>

        <fieldset className="grid gap-1 border-2 border-dashed border-ink/40 p-3">
          <legend className="px-1 font-type text-sm uppercase">Nível dos desafios</legend>
          <p className="text-sm">
            {level
              ? values.levelOverride
                ? `Nível ${level} (ajustado manualmente).`
                : `Nível ${level}, calculado pela série (${LEVEL_HINT[level]}).`
              : 'Escolha a série para calcular o nível.'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">Ajustar:</span>
            <button
              type="button"
              aria-pressed={values.levelOverride === null}
              onClick={() => setValues((v) => ({ ...v, levelOverride: null }))}
              className={chip(values.levelOverride === null)}
            >
              Automático
            </button>
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={values.levelOverride === l}
                onClick={() => setValues((v) => ({ ...v, levelOverride: l }))}
                className={chip(values.levelOverride === l)}
                title={LEVEL_HINT[l]}
              >
                {l}
              </button>
            ))}
          </div>
        </fieldset>

        {saveError && (
          <p
            role="alert"
            className="border-l-4 border-bando bg-bando/10 p-2 font-bold text-bando-dark"
          >
            {saveError}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <ComicButton variant="paper" onClick={onClose}>
            Cancelar
          </ComicButton>
          <ComicButton type="submit" variant="red" icon="✔" disabled={saving}>
            {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar turma'}
          </ComicButton>
        </div>
      </form>
    </motion.div>
  );
}
