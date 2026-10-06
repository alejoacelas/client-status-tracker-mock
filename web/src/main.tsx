import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import ClientPage, { Notice } from './pages/ClientPage';
import { Spinner } from './components/ui';
import './styles.css';

// The staff console loads separately so client pages stay small.
const AdminApp = lazy(() => import('./admin/AdminApp'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/c/:token" element={<ClientPage />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<Spinner />}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="*" element={<Notice title="Page not found" body="There's nothing at this address." />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
