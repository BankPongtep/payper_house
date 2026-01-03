import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import OwnerLayout from './layouts/OwnerLayout';
import Assets from './pages/owner/Assets';
import Customers from './pages/owner/Customers';
import Contracts from './pages/owner/Contracts';
import CreateContract from './pages/owner/CreateContract';
import OwnerDashboard from './pages/owner/Dashboard';
import CustomerLayout from './layouts/CustomerLayout';
import CustomerDashboard from './pages/customer/Dashboard';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import UsersPage from './pages/admin/Users';
import Settings from './pages/admin/Settings';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/admin" element={<AdminLayout />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="settings" element={<Settings />} />
                </Route>

                {/* Protected Routes Placeholders */}
                <Route path="/owner" element={<OwnerLayout />}>
                    <Route path="dashboard" element={<OwnerDashboard />} />
                    <Route path="assets" element={<Assets />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="contracts" element={<Contracts />} />
                    <Route path="contracts/create" element={<CreateContract />} />
                </Route>

                <Route path="/customer" element={<CustomerLayout />}>
                    <Route path="dashboard" element={<CustomerDashboard />} />
                </Route>

                <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

if (document.getElementById('app')) {
    const root = createRoot(document.getElementById('app'));
    root.render(<App />);
}
