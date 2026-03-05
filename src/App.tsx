import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AffiliateLanding from './pages/AffiliateLanding';
import Login from './pages/Login';
import PartnerDashboard from './pages/PartnerDashboard';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/partenaire" replace />} />
        <Route path="/partenaire" element={<AffiliateLanding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/partner/dashboard" element={<PartnerDashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/partenaire" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
