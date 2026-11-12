import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
const ProtectedRoute = ({ children, allowedRoles, requiredCapability }) => {
  const { user, isAuthenticated, isLoading, can } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (allowedRoles && user && user.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  if (requiredCapability && !can(requiredCapability)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};
var ProtectedRoute_default = ProtectedRoute;
export {
  ProtectedRoute_default as default
};
