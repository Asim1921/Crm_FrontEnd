import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ClientManagement from './pages/ClientManagement';
import ClientProfile from './pages/ClientProfile';
import TaskManagement from './pages/TaskManagement';
import CommunicationsHub from './pages/CommunicationsHub';
import ReportsAnalytics from './pages/ReportsAnalytics';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import './styles/globals.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="clients" element={<ClientManagement />} />
              <Route path="clients/:id" element={<ClientProfile />} />
              <Route path="tasks" element={<TaskManagement />} />
              <Route path="communications" element={<CommunicationsHub />} />
              <Route path="reports" element={<ReportsAnalytics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
