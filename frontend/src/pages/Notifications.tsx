import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    Inbox,
    CalendarClock,
    Wrench,
    CheckCheck,
    Check,
    ArrowRight,
    AlertTriangle,
} from 'lucide-react';
import { Card, Button } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import {
    fetchNotifications,
    fetchReadIds,
    markNotificationsRead,
    mergeRead,
    type WithRead,
    type NotifQueryOpts,
} from '../lib/notifications';

type Filter = 'all' | 'unread' | 'membership' | 'equipment';

const relTime = (ts: number): string => {
    const diff = Date.now() - ts;
    const days = Math.round(diff / (24 * 60 * 60 * 1000));
    if (diff < 0) return days <= 0 ? 'due now' : `in ${Math.abs(days)}d`;
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    return `${days}d ago`;
};

const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const { user, can } = useAuth();
    const { notify } = useToast();

    const opts: NotifQueryOpts = {
        membership: can('members.view'),
        equipment: can('equipment.view'),
    };
    const canSeeAny = opts.membership || opts.equipment;

    const [items, setItems] = useState<WithRead[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('all');

    const load = useCallback(async () => {
        if (!user?.id || !canSeeAny) {
            setItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [notifs, readIds] = await Promise.all([
                fetchNotifications(opts),
                fetchReadIds(),
            ]);
            setItems(mergeRead(notifs, readIds).all);
        } catch {
            notify('Could not load notifications', 'error');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, opts.membership, opts.equipment]);

    useEffect(() => {
        load();
    }, [load]);

    const markRead = async (id: string) => {
        if (!user?.id) return;
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        try {
            await markNotificationsRead([id]);
        } catch {
            notify('Failed to update read state', 'error');
            load();
        }
    };

    const handleOpen = (n: WithRead) => {
        void markRead(n.id);
        navigate(n.link);
    };

    const markAll = async () => {
        if (!user?.id) return;
        const ids = items.filter((n) => !n.read).map((n) => n.id);
        if (ids.length === 0) return;
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        try {
            await markNotificationsRead(ids);
        } catch {
            notify('Failed to update read state', 'error');
            load();
        }
    };

    const unreadCount = items.filter((n) => !n.read).length;
    const visible = items.filter((n) => {
        if (filter === 'unread') return !n.read;
        if (filter === 'membership') return n.category === 'membership';
        if (filter === 'equipment') return n.category === 'equipment';
        return true;
    });

    return (
        <div className="max-w-[900px] mx-auto pb-16 animate-in fade-in duration-700">
            <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-[10px] mb-3">
                        <Bell className="h-3.5 w-3.5" /> Notification Center
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none">Notifications</h1>
                    <p className="text-slate-500 mt-4 text-lg font-medium">
                        {canSeeAny
                            ? `${unreadCount} unread alert${unreadCount === 1 ? '' : 's'} from memberships and equipment.`
                            : 'Alerts about renewals, attendance and equipment will appear here.'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" className="rounded-xl h-11 px-5" icon={CheckCheck} onClick={markAll}>
                        Mark all as read
                    </Button>
                )}
            </div>

            {canSeeAny && items.length > 0 && (
                <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner border border-slate-200 w-fit mb-6">
                    {(['all', 'unread', 'membership', 'equipment'] as Filter[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all capitalize ${filter === f ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <Card className="rounded-[32px] border-0 shadow-xl shadow-slate-200/40 bg-white p-16 text-center">
                    <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Loading notifications...</p>
                </Card>
            ) : !canSeeAny || visible.length === 0 ? (
                <Card className="rounded-[32px] border-0 shadow-xl shadow-slate-200/40 bg-white p-10 text-center">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-6">
                        <Inbox className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        {items.length === 0 ? "You're all caught up" : `No ${filter} notifications`}
                    </h2>
                    <p className="text-slate-500 text-sm font-medium mt-3 max-w-md mx-auto leading-relaxed">
                        {items.length === 0
                            ? 'New alerts about expiring memberships and equipment maintenance will show up here automatically.'
                            : 'Try a different filter.'}
                    </p>
                    {items.length === 0 && (
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                            {can('members.view') && (
                                <button onClick={() => navigate('/members')} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                                    View Members
                                </button>
                            )}
                            <button onClick={() => navigate('/')} className="px-6 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2">
                                <CalendarClock className="h-3.5 w-3.5" /> Back to Dashboard
                            </button>
                        </div>
                    )}
                </Card>
            ) : (
                <div className="space-y-3">
                    {visible.map((n) => {
                        const CatIcon = n.category === 'membership' ? CalendarClock : Wrench;
                        const critical = n.severity === 'critical';
                        return (
                            <button
                                key={n.id}
                                onClick={() => handleOpen(n)}
                                className={`w-full text-left flex items-start gap-4 p-5 rounded-3xl border bg-white transition-all hover:shadow-lg hover:-translate-y-0.5 ${n.read ? 'border-slate-100 opacity-70' : 'border-slate-100 shadow-md shadow-slate-200/40'}`}
                            >
                                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${critical ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                    <CatIcon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {!n.read && <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />}
                                        <p className="text-sm font-black text-slate-900 truncate">{n.title}</p>
                                        <span className={`ml-auto shrink-0 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${critical ? 'text-rose-600' : 'text-amber-600'}`}>
                                            {critical && <AlertTriangle className="h-3 w-3" />}
                                            {relTime(n.sort_ts)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mt-1">{n.body}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 self-center">
                                    {n.read ? (
                                        <Check className="h-4 w-4 text-slate-300" />
                                    ) : (
                                        <ArrowRight className="h-4 w-4 text-slate-400" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Notifications;
