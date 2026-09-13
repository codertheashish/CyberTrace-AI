import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import RequireAuth from './components/RequireAuth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Complaints from './pages/Complaints';
import ComplaintDetail from './pages/ComplaintDetail';
import TransactionIntelligence from './pages/TransactionIntelligence';
import NetworkGraphPage from './pages/NetworkGraphPage';
import LocationIntelligence from './pages/LocationIntelligence';
import Predictions from './pages/Predictions';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import DataExplorer from './pages/DataExplorer';
import SystemInfo from './pages/SystemInfo';
import DemoMode from './pages/DemoMode';
import AdminSettings from './pages/AdminSettings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/complaints/:id" element={<ComplaintDetail />} />
            <Route path="/transactions" element={<TransactionIntelligence />} />
            <Route path="/network" element={<NetworkGraphPage />} />
            <Route path="/locations" element={<LocationIntelligence />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/explorer" element={<DataExplorer />} />
            <Route path="/system" element={<SystemInfo />} />
            <Route path="/demo" element={<DemoMode />} />
            <Route path="/admin-settings" element={<AdminSettings />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
