import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../../contexts/AuthContext";

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-[70] w-64 transform transition-transform duration-200 ease-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {user && user.emailVerified === false && (
          <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
            Please verify your email so this account stays recoverable. Check your inbox for the verification link.
          </div>
        )}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="relative z-10 flex-1 overflow-y-auto p-4 scrollbar-thin sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
