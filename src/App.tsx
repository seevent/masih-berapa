import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { InventoryProvider } from './context/InventoryContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CatalogPage } from './pages/CatalogPage';
import { MutationPage } from './pages/MutationPage';
import { HistoryPage } from './pages/HistoryPage';
import { ScannerPage } from './pages/ScannerPage';
import { PrintLabelPage } from './pages/PrintLabelPage';
import { PredictiveAlertsPage } from './pages/PredictiveAlertsPage';
import { PredictiveNeedsPage } from './pages/PredictiveNeedsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <NotificationProvider>
      <InventoryProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="input-sparepart" element={<MutationPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="scanner" element={<ScannerPage />} />
              <Route path="print" element={<PrintLabelPage />} />
              <Route path="alerts" element={<PredictiveAlertsPage />} />
              <Route path="needs" element={<PredictiveNeedsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </InventoryProvider>
    </NotificationProvider>
  );
};

export default App;
