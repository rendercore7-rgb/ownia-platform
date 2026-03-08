import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import Home from './pages/Home'
import Participate from './pages/Participate'
import Agreement from './pages/Agreement'
import BankInfo from './pages/BankInfo'
import Complete from './pages/Complete'
import Dashboard from './pages/Dashboard'
import LandMap from './pages/LandMap'
import Admin from './pages/Admin'
import TherapyCoupon from './pages/TherapyCoupon'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/participate" element={<ProtectedRoute><Participate /></ProtectedRoute>} />
          <Route path="/participate/agreement" element={<ProtectedRoute><Agreement /></ProtectedRoute>} />
          <Route path="/participate/bank-info" element={<ProtectedRoute><BankInfo /></ProtectedRoute>} />
          <Route path="/participate/complete" element={<ProtectedRoute><Complete /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/land-map" element={<ProtectedRoute><LandMap /></ProtectedRoute>} />
          <Route path="/therapy-coupon" element={<ProtectedRoute><TherapyCoupon /></ProtectedRoute>} />

          {/* Admin route (자체 비밀번호 인증) */}
          <Route path="/admin" element={<Admin />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
