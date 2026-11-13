import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { PublicOnly, RequireAuth } from '@/components/RouteGuards';
import { Toaster } from '@/components/ui/Feedback';
import Login from '@/pages/auth/Login';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import VerifyOtp from '@/pages/auth/VerifyOtp';
import ResetPassword from '@/pages/auth/ResetPassword';
import NotFound from '@/pages/NotFound';

const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const Leads = lazy(() => import('@/pages/leads/Leads'));
const Pipeline = lazy(() => import('@/pages/pipeline/Pipeline'));
const Customers = lazy(() => import('@/pages/customers/Customers'));
const CustomerDetail = lazy(() => import('@/pages/customers/CustomerDetail'));
const Tasks = lazy(() => import('@/pages/tasks/Tasks'));
const Activities = lazy(() => import('@/pages/activities/Activities'));
const Reports = lazy(() => import('@/pages/reports/Reports'));
const Notifications = lazy(() => import('@/pages/notifications/Notifications'));
const Profile = lazy(() => import('@/pages/profile/Profile'));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
        {/* The OTP / reset steps are guarded by the in-progress reset flow, not by session state */}
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="activities" element={<Activities />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
