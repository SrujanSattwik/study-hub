import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/shared/ProtectedRoute';
import Loader from '../components/ui/Loader';

// Public pages
import Home from '../pages/Home';
import About from '../pages/About';

// Auth pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Layout shells
import DashboardLayout from '../layouts/DashboardLayout';

// Lazy loaded protected pages
const Dashboard = React.lazy(() => import('../pages/dashboard/Dashboard'));
const SyllabusScheduler = React.lazy(() => import('../pages/dashboard/SyllabusScheduler'));
const Materials = React.lazy(() => import('../pages/materials/Materials'));
const Community = React.lazy(() => import('../pages/community/Community'));
const KnowNook = React.lazy(() => import('../pages/knownook/KnowNook'));
const Subscription = React.lazy(() => import('../pages/dashboard/Subscription'));

const PageFallback: React.FC = () => (
  <div className="flex h-full w-full items-center justify-center p-12">
    <Loader size="md" label="Loading module..." />
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        
        {/* Guest Routes (Unauthenticated only) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="/syllabus"
              element={
                <Suspense fallback={<PageFallback />}>
                  <SyllabusScheduler />
                </Suspense>
              }
            />
            <Route
              path="/materials"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Materials />
                </Suspense>
              }
            />
            <Route
              path="/community"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Community />
                </Suspense>
              }
            />
            <Route
              path="/knownook"
              element={
                <Suspense fallback={<PageFallback />}>
                  <KnowNook />
                </Suspense>
              }
            />
            <Route
              path="/subscription"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Subscription />
                </Suspense>
              }
            />
          </Route>
        </Route>

        {/* Fallback Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRouter;
