import { lazy, Suspense } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { ToastProvider } from "./components/ui/Toast";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import Login from "./pages/auth/Login";
const MarketingHome = lazy(() => import("./pages/marketing/Home"));
const MarketingFeatures = lazy(() => import("./pages/marketing/Features"));
const MarketingHowItWorks = lazy(() => import("./pages/marketing/HowItWorks"));
const MarketingSolutions = lazy(() => import("./pages/marketing/Solutions"));
const MarketingPricing = lazy(() => import("./pages/marketing/Pricing"));
const MarketingAbout = lazy(() => import("./pages/marketing/About"));
const MarketingContact = lazy(() => import("./pages/marketing/Contact"));
const PlatformLayout = lazy(() => import("./pages/platform/PlatformLayout"));
const PlatformDashboard = lazy(() => import("./pages/platform/PlatformDashboard"));
const PlatformOrganizations = lazy(() => import("./pages/platform/Organizations"));
const PlatformPlans = lazy(() => import("./pages/platform/Plans"));
const PlatformActivationKeys = lazy(() => import("./pages/platform/ActivationKeys"));
const Subscription = lazy(() => import("./pages/subscription/Subscription"));
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { OrganizationProvider, useOrganization } from "./contexts/OrganizationContext";
import { MANAGEMENT_ROLES, resolveOrgRole } from "./lib/permissions";
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const MemberPortal = lazy(() => import("./pages/portal/MemberPortal"));
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
const RoleHome = () => {
  const { memberships, currentOrganization, isLoading } = useOrganization();
  const { user } = useAuth();
  if (isLoading) return <PageFallback />;
  // Role is resolved from the selected org's membership only. Anything that
  // is not a known management role (member, legacy "user", missing or
  // unresolved membership) lands on the member portal — never the
  // management dashboard.
  const fallback = user?.platformAdmin ? "platform_admin" : user?.role;
  const role = resolveOrgRole(memberships, currentOrganization?.id, fallback);
  return (
    <Layout>
      {role && MANAGEMENT_ROLES.has(role) ? <Dashboard /> : <MemberPortal />}
    </Layout>
  );
};
const HomeOrApp = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageFallback />;
  return user ? <RoleHome /> : <MarketingHome />;
};
function App() {
  return <AuthProvider>
      <OrganizationProvider>
        <ToastProvider>
          <Router>
            <ErrorBoundary>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/login" element={<Login />} />

                  {/* Public marketing site — unauthenticated visitors.
                      "/" is resolved by HomeOrApp below (marketing when logged out). */}
                  <Route path="/features" element={<MarketingFeatures />} />
                  <Route path="/how-it-works" element={<MarketingHowItWorks />} />
                  <Route path="/solutions" element={<MarketingSolutions />} />
                  <Route path="/pricing" element={<MarketingPricing />} />
                  <Route path="/about" element={<MarketingAbout />} />
                  <Route path="/contact" element={<MarketingContact />} />
                  <Route path="/" element={<HomeOrApp />} />

                  {/* Vendor platform admin — guarded by user.platformAdmin inside layout. */}
                  <Route path="/platform" element={<PlatformLayout />}>
                    <Route index element={<PlatformDashboard />} />
                    <Route path="organizations" element={<PlatformOrganizations />} />
                    <Route path="plans" element={<PlatformPlans />} />
                    <Route path="activation-keys" element={<PlatformActivationKeys />} />
                  </Route>

                  <Route element={<ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>}>
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
                    <Route path="/subscription" element={<Subscription />} />
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
