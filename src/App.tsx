import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { InventoryProvider } from './context/InventoryContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages are split into separate chunks so heavy libraries (recharts, xlsx, jspdf, html5-qrcode)
// are only downloaded when the page that needs them is opened.
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const CatalogPage = lazy(() => import('./pages/CatalogPage').then((m) => ({ default: m.CatalogPage })));
const MutationPage = lazy(() => import('./pages/MutationPage').then((m) => ({ default: m.MutationPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const ScannerPage = lazy(() => import('./pages/ScannerPage').then((m) => ({ default: m.ScannerPage })));
const PrintLabelPage = lazy(() => import('./pages/PrintLabelPage').then((m) => ({ default: m.PrintLabelPage })));
const PredictiveAlertsPage = lazy(() => import('./pages/PredictiveAlertsPage').then((m) => ({ default: m.PredictiveAlertsPage })));
const PredictiveNeedsPage = lazy(() => import('./pages/PredictiveNeedsPage').then((m) => ({ default: m.PredictiveNeedsPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const PageFallback: React.FC = () => (
  <div className="py-20 text-center text-sm text-slate-500">Memuat halaman...</div>
);

const page = (element: React.ReactNode) => <Suspense fallback={<PageFallback />}>{element}</Suspense>;

export const App: React.FC = () => {
  return (
    <NotificationProvider>
      <InventoryProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={page(<DashboardPage />)} />
              <Route path="catalog" element={page(<CatalogPage />)} />
              <Route path="input-sparepart" element={page(<MutationPage />)} />
              <Route path="history" element={page(<HistoryPage />)} />
              <Route path="scanner" element={page(<ScannerPage />)} />
              <Route path="print" element={page(<PrintLabelPage />)} />
              <Route path="alerts" element={page(<PredictiveAlertsPage />)} />
              <Route path="needs" element={page(<PredictiveNeedsPage />)} />
              <Route path="reports" element={page(<ReportsPage />)} />
              <Route path="settings" element={page(<SettingsPage />)} />
            </Route>
          </Routes>
        </BrowserRouter>
      </InventoryProvider>
    </NotificationProvider>
  );
};

export default App;
