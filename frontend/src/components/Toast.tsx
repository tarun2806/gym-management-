import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    kind: ToastKind;
    message: string;
}

interface ToastApi {
    notify: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TOAST_STYLES: Record<ToastKind, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
    success: { icon: CheckCircle2, className: 'bg-emerald-500/95 border-emerald-400' },
    error: { icon: AlertCircle, className: 'bg-rose-500/95 border-rose-400' },
    info: { icon: Info, className: 'bg-slate-900/95 border-slate-700' },
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
    const style = TOAST_STYLES[toast.kind];
    const Icon = style.icon;
    return (
        <div
            role="status"
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300 ${style.className}`}
        >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <p className="flex-1 text-[11px] font-bold tracking-tight leading-snug">{toast.message}</p>
            <button onClick={onDismiss} className="p-1 rounded-lg hover:bg-white/15 transition-colors" aria-label="Dismiss">
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const counter = useRef(0);

    const dismiss = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const notify = useCallback((message: string, kind: ToastKind = 'info') => {
        const id = ++counter.current;
        setToasts(prev => [...prev.slice(-3), { id, kind, message }]);
        setTimeout(() => dismiss(id), 3500);
    }, [dismiss]);

    const api = useMemo(() => ({ notify }), [notify]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className="pointer-events-none fixed bottom-6 left-1/2 z-[300] flex w-full max-w-sm -translate-x-1/2 flex-col gap-3 px-4">
                {toasts.map(t => (
                    <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastApi => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
};
