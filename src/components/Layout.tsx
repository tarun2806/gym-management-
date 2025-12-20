
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-md transition-opacity lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Shell */}
            <div className={`
        fixed inset-y-0 left-0 z-[70] w-72 transform transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full shadow-none'}
        shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]
      `}>
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Main Interface */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />

                {/* Main Dynamic Viewport */}
                <main className="flex-1 overflow-y-auto focus:outline-none p-6 sm:p-10 lg:p-12 relative z-10 custom-scrollbar scroll-smooth">
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
