import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from './authStore';
import { LoadingScreen } from './LoadingScreen';

/** Protege as rotas da Narradora. `admin` exige papel de administradora. */
export function RequireInstructor({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const state = useAuthStore((s) => s.state);
  const init = useAuthStore((s) => s.init);
  const location = useLocation();
  useEffect(() => init(), [init]);

  if (state.status === 'loading') return <LoadingScreen />;
  if (state.status !== 'ready')
    return <Navigate to="/instrutor" replace state={{ from: location.pathname }} />;
  if (admin && state.profile.role !== 'admin') return <Navigate to="/instrutor/turmas" replace />;
  return <>{children}</>;
}
