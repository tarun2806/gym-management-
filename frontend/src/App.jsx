import { lazy, Suspense } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { ToastProvider } from "./components/ui/Toast";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import Login from "./pages/auth/Login";
import { AuthProvider } from "./contexts/AuthContext";
import { OrganizationProvider } from "./contexts/OrganizationContext";
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const Members = lazy(() => import("./pages/members/Members"));
const Classes = lazy(() => import("./pages/classes/Classes"));
const Trainers = lazy(() => import("./pages/trainers/Trainers"));
const Equipment = lazy(() => import("./pages/inventory/Equipment"));
const Admin = lazy(() => import("./pages/admin/Admin"));
const Payments = lazy(() => import("./pages/payments/Payments"));
const Reports = lazy(() => import("./pages/reports/ReportsEnhanced"));
const MembershipPlans = lazy(() => import("./pages/memberships/MembershipPlans"));
const Attendance = lazy(() => import("./pages/attendance/Attendance"));
const WorkoutPlans = lazy(() => import("./pages/workouts/WorkoutPlans"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const DietPlans = lazy(() => import("./pages/workouts/DietPlans"));
const Notifications = lazy(() => import("./pages/notifications/Notifications"));
const Organizations = lazy(() => import("./pages/organizations/Organizations"));
const Branches = lazy(() => import("./pages/organizations/Branches"));
const PersonalTraining = lazy(() => import("./pages/workouts/PersonalTraining"));
const Billing = lazy(() => import("./pages/payments/Billing"));
const Expenses = lazy(() => import("./pages/payments/Expenses"));
const Payroll = lazy(() => import("./pages/payments/Payroll"));
const Inventory = lazy(() => import("./pages/inventory/Inventory"));
const PageFallback = () => <div className="flex h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
  </div>;
function App() {
  return <AuthProvider>
      <OrganizationProvider>
        <ToastProvider>
          <Router>
            <ErrorBoundary>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/login" element={<Login />} />

                  <Route element={<ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>}>
                    <Route path="/" element={<Dashboard />} />
                    <Route
    path="/members"
    element={<ProtectedRoute requiredCapability="members.view">
                          <Members />
                        </ProtectedRoute>}
  />
                    <Route
    path="/classes"
    element={<ProtectedRoute requiredCapability="classes">
                          <Classes />
                        </ProtectedRoute>}
  />
                    <Route
    path="/trainers"
    element={<ProtectedRoute requiredCapability="trainers.view">
                          <Trainers />
                        </ProtectedRoute>}
  />
                    <Route
    path="/equipment"
    element={<ProtectedRoute requiredCapability="equipment.view">
                          <Equipment />
                        </ProtectedRoute>}
  />
                    <Route
    path="/admin"
    element={<ProtectedRoute requiredCapability="admin">
                          <Admin />
                        </ProtectedRoute>}
  />

                    {
    /* New Routes */
  }
                    <Route
    path="/payments"
    element={<ProtectedRoute requiredCapability="payments">
                          <Payments />
                        </ProtectedRoute>}
  />
                    <Route
    path="/reports"
    element={<ProtectedRoute requiredCapability="reports">
                          <Reports />
                        </ProtectedRoute>}
  />
                    <Route
    path="/plans"
    element={<ProtectedRoute requiredCapability="plans">
                          <MembershipPlans />
                        </ProtectedRoute>}
  />
                    <Route
    path="/attendance"
    element={<ProtectedRoute requiredCapability="attendance">
                          <Attendance />
                        </ProtectedRoute>}
  />
                    <Route
    path="/workouts"
    element={<ProtectedRoute requiredCapability="workouts">
                          <WorkoutPlans />
                        </ProtectedRoute>}
  />
                    <Route
    path="/diet-plans"
    element={<ProtectedRoute requiredCapability="diet">
                          <DietPlans />
                        </ProtectedRoute>}
  />
                    <Route
    path="/notifications"
    element={<ProtectedRoute requiredCapability="dashboard">
                          <Notifications />
                        </ProtectedRoute>}
  />
                    {
    /* Multi-tenant Management */
  }
                    <Route
    path="/organizations"
    element={<ProtectedRoute requiredCapability="organizations.view">
                          <Organizations />
                        </ProtectedRoute>}
  />
                    <Route
    path="/branches"
    element={<ProtectedRoute requiredCapability="branches.view">
                          <Branches />
                        </ProtectedRoute>}
  />
                    {
    /* New Business Modules */
  }
                    <Route
    path="/personal-training"
    element={<ProtectedRoute requiredCapability="trainers.view">
                          <PersonalTraining />
                        </ProtectedRoute>}
  />
                    <Route
    path="/billing"
    element={<ProtectedRoute requiredCapability="payments">
                          <Billing />
                        </ProtectedRoute>}
  />
                    <Route
    path="/expenses"
    element={<ProtectedRoute requiredCapability="reports">
                          <Expenses />
                        </ProtectedRoute>}
  />
                    <Route
    path="/payroll"
    element={<ProtectedRoute requiredCapability="admin">
                          <Payroll />
                        </ProtectedRoute>}
  />
                    <Route
    path="/inventory"
    element={<ProtectedRoute requiredCapability="equipment.view">
                          <Inventory />
                        </ProtectedRoute>}
  />
                    {
    /* Personal settings: reachable by every signed-in role. */
  }
                    <Route path="/settings" element={<Settings />} />
                  </Route>

                  {
    /* Catch all redirect to dashboard */
  }
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </Router>
        </ToastProvider>
      </OrganizationProvider>
    </AuthProvider>;
}
export {
  App as default
};
