import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout, ProtectedRoute } from "./components";
import {
  Dashboard,
  Members,
  Classes,
  Trainers,
  Equipment,
  Admin,
  Login,
  Payments,
  Reports,
  MembershipPlans,
  Attendance,
  WorkoutPlans,
  Settings,
  DietPlans
} from "./pages";
import { AuthProvider } from "./contexts/AuthContext";


export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/trainers" element={<Trainers />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/admin" element={<Admin />} />

            {/* New Routes */}
            <Route path="/payments" element={<Payments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/plans" element={<MembershipPlans />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/workouts" element={<WorkoutPlans />} />
            <Route path="/diet-plans" element={<DietPlans />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Catch all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
