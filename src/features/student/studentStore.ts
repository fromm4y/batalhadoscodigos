import { signInWithCustomToken } from 'firebase/auth';
import { create } from 'zustand';
import { getFirebase } from '@/lib/firebase';
import type { JoinData } from './api';

const KEY = 'cacada.join';

function load(): JoinData | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as JoinData) : null;
  } catch {
    return null;
  }
}

type StudentStore = {
  /** Dados públicos da sessão (depois de digitar o código). Ficam na aba (sessionStorage). */
  join: JoinData | null;
  setJoin: (j: JoinData | null) => void;
  /** Entra no Firebase com o custom token devolvido pela API. */
  enter: (customToken: string) => Promise<void>;
};

export const useStudentStore = create<StudentStore>((set) => ({
  join: load(),
  setJoin(j) {
    try {
      if (j) sessionStorage.setItem(KEY, JSON.stringify(j));
      else sessionStorage.removeItem(KEY);
    } catch {
      /* navegação privada: segue só em memória */
    }
    set({ join: j });
  },
  async enter(customToken) {
    await signInWithCustomToken(getFirebase().auth, customToken);
  },
}));
