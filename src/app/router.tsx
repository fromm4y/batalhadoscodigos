import { createBrowserRouter } from 'react-router';
import { ComicTestPage } from './ComicTestPage';
import { ComingSoon } from './ComingSoon';
import { HomePage } from './HomePage';
import { PrototypePage } from './prototype/PrototypePage';
import { AdminPage } from '@/features/instructor/admin/AdminPage';
import { InstructorLoginPage } from '@/features/instructor/auth/InstructorLoginPage';
import { RequireInstructor } from '@/features/instructor/auth/RequireInstructor';
import { ClassesPage } from '@/features/instructor/classes/ClassesPage';

/** Rotas do SPEC 9.1. As telas reais chegam nas etapas indicadas. */
export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/teste-hq', element: <ComicTestPage /> },
  { path: '/prototipo', element: <PrototypePage /> },
  { path: '/dupla', element: <ComingSoon title="Escolher dupla" stage={2} /> },
  { path: '/dupla/nova', element: <ComingSoon title="Nova dupla" stage={2} /> },
  { path: '/jogo', element: <ComingSoon title="O Jogo" stage={3} /> },
  { path: '/instrutor', element: <InstructorLoginPage /> },
  {
    path: '/instrutor/turmas',
    element: (
      <RequireInstructor>
        <ClassesPage />
      </RequireInstructor>
    ),
  },
  { path: '/instrutor/turmas/:classId', element: <ComingSoon title="Turma" stage={2} /> },
  {
    path: '/instrutor/sessao/:sessionId',
    element: <ComingSoon title="Painel da Narradora" stage={5} />,
  },
  { path: '/projetor/:sessionId', element: <ComingSoon title="Tela do projetor" stage={6} /> },
  {
    path: '/admin',
    element: (
      <RequireInstructor admin>
        <AdminPage />
      </RequireInstructor>
    ),
  },
  { path: '*', element: <ComingSoon title="Página não encontrada" stage={0} /> },
]);
