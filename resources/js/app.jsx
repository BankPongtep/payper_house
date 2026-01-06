import './bootstrap';
import './i18n';
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
import ContractDetail from './pages/owner/ContractDetail';
import ContractPrint from './pages/owner/ContractPrint';
import Receipt from './pages/Receipt';

// ...


import CreateContract from './pages/owner/CreateContract';
import OwnerDashboard from './pages/owner/Dashboard';
import OwnerPayments from './pages/owner/OwnerPayments';
import OwnerSettings from './pages/owner/OwnerSettings';
import CustomerLayout from './layouts/CustomerLayout';
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerContracts from './pages/customer/Contracts';
import CustomerContractDetail from './pages/customer/ContractDetail';
import CustomerSettings from './pages/customer/Settings';
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

                {/* Owner Routes */}
                <Route path="/owner" element={<OwnerLayout />}>
                    <Route path="dashboard" element={<OwnerDashboard />} />
                    <Route path="assets" element={<Assets />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="contracts" element={<Contracts />} />
                    <Route path="contracts/create" element={<CreateContract />} />
                    <Route path="contracts/:id" element={<ContractDetail />} />
                    <Route path="payments" element={<OwnerPayments />} />
                    <Route path="settings" element={<OwnerSettings />} />
                </Route>

                {/* Print routes - outside layout for clean printing */}
                <Route path="/owner/contracts/:id/print" element={<ContractPrint />} />
                <Route path="/receipts/:id" element={<Receipt />} />

                {/* Customer Routes */}
                <Route path="/customer" element={<CustomerLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<CustomerDashboard />} />
                    <Route path="contracts" element={<CustomerContracts />} />
                    <Route path="contracts/:id" element={<CustomerContractDetail />} />
                    <Route path="settings" element={<CustomerSettings />} />
                </Route>

                <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter >
    );
}

if (document.getElementById('app')) {
    const root = createRoot(document.getElementById('app'));
    root.render(<App />);
}
