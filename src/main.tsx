import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import { RouterProvider } from 'react-router';
import { router } from './app/router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Respeita prefers-reduced-motion em todo o app (SPEC 9.6). */}
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
    </MotionConfig>
  </StrictMode>,
);
