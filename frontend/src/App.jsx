// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth';
import AppLayout from './AppLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OwnerDashboard from './pages/OwnerDashboard';
import BusinessForm from './components/BusinessForm';

export default function App() {
  return (
    <AuthProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/business/new" element={<BusinessForm />} />
          <Route path="/owner/business/:id/edit" element={<BusinessForm />} />
        </Routes>
      </AppLayout>
    </AuthProvider>
  );
}
