
import React, { useState, useEffect } from 'react';
import {
    Plus,
    ChevronRight,
    Dumbbell,
    Calendar,
    Trash2,
    X,
    Play,
    ListFilter,
    User,
    Flame,
    Zap,
    Target,
    TrendingUp,
    UserCheck,
    CalendarCheck
} from 'lucide-react';
import { Button, Card } from '../components';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { logAudit } from '../lib/audit';
import { memberService, trainerService } from '../lib/services';
import type { WorkoutExercise, WorkoutPlan, WorkoutCompletion } from '../types';
import { WORKOUT_OBJECTIVES, WORKOUT_LEVELS, MUSCLE_GROUPS, computeCompletionStats } from '../lib/workouts';

const WorkoutPlans: React.FC = () => {
    const { notify } = useToast();
    const { user, can } = useAuth();
    const canManage = can('workouts');
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
    const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);

    // Create Plan Form
    const [newPlan, setNewPlan] = useState({
        name: '',
        description: '',
        member_id: '',
        trainer_id: '',
        objective: '',
        level: '',
        weeks: '',
        days_per_week: ''
    });

    // Exercise Form
    const [newExercise, setNewExercise] = useState<WorkoutExercise>({
        name: '',
        sets: 3,
        reps: 12,
        weight: '',
        category: '',
        rest: '',
        notes: ''
    });
    const [itemLoading, setItemLoading] = useState(false);

    useEffect(() => {
        fetchPlans();
        fetchMembers();
        fetchTrainers();
    }, []);

    const parseJson = <T,>(v: unknown, fallback: T): T => {
        if (v == null) return fallback;
        if (typeof v !== 'string') return v as T;
        try { return JSON.parse(v) as T; } catch { return fallback; }
    };

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const [rows, memberRows] = await Promise.all([
                api<Record<string, unknown>[]>('/api/workout-plans'),
                memberService.list().catch(() => []),
            ]);
            const nameById = new Map(memberRows.map(m => [m.id, m.name]));
            const fetchedPlans = rows.map(r => ({
                id: String(r.id),
                ...(r as object),
                member: { name: (r.member_id && nameById.get(String(r.member_id))) || 'Public' },
                exercises: parseJson<WorkoutExercise[]>(r.exercises, []),
                completions: parseJson<WorkoutCompletion[]>(r.completions, []),
            })) as WorkoutPlan[];
            setPlans(fetchedPlans);
        } catch (err) {
            console.error('Error fetching plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const list = await memberService.list();
            setMembers(list.map(m => ({ id: m.id, name: m.name })));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTrainers = async () => {
        try {
            const list = await trainerService.list();
            setTrainers(list.map(t => ({ id: t.id, name: t.name })));
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setItemLoading(true);
        try {
            await api('/api/workout-plans', {
                method: 'POST',
                body: {
                    name: newPlan.name.trim(),
                    description: newPlan.description.trim(),
                    member_id: newPlan.member_id || null,
                    trainer_id: newPlan.trainer_id || null,
                    objective: newPlan.objective || null,
                    level: newPlan.level || null,
                    weeks: Number(newPlan.weeks) || null,
                    days_per_week: Number(newPlan.days_per_week) || null,
                    exercises: '[]',
                    completions: '[]',
                }
            });

            setNewPlan({ name: '', description: '', member_id: '', trainer_id: '', objective: '', level: '', weeks: '', days_per_week: '' });
            setShowCreateModal(false);
            fetchPlans();
            notify('Workout plan created', 'success');
        } catch (err) {
            console.error('Error creating plan:', err);
            notify('Failed to create plan', 'error');
        } finally {
            setItemLoading(false);
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm('Are you sure you want to delete this workout plan?')) return;

        try {
            await api(`/api/workout-plans/${id}`, { method: 'DELETE' });
            await logAudit('warning', `Workout plan deleted: ID ${id}`, user?.username || 'staff', 'workout_delete');
            fetchPlans();
        } catch (err) {
            console.error('Error deleting plan:', err);
        }
    };

    const handleAddExercise = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlan) return;
        setItemLoading(true);
        try {
            const exerciseToAdd = {
                ...newExercise,
                id: Date.now().toString() // Generate a simple unique ID for local identification
            };

            await api(`/api/workout-plans/${selectedPlan.id}`, {
                method: 'PUT',
                body: { exercises: JSON.stringify([...(selectedPlan.exercises || []), exerciseToAdd]) }
            });

            setNewExercise({ name: '', sets: 3, reps: 12, weight: '', category: '', rest: '', notes: '' });

            // Update local state to reflect changes immediately
            const updatedPlan = {
                ...selectedPlan,
                exercises: [...(selectedPlan.exercises || []), exerciseToAdd]
            };
            setSelectedPlan(updatedPlan);

            // Also update the list
            setPlans(plans.map(p => p.id === selectedPlan.id ? updatedPlan : p));
            notify('Exercise added', 'success');

        } catch (err) {
            console.error(err);
            notify('Failed to add exercise', 'error');
        } finally {
            setItemLoading(false);
        }
    };

    const handleDeleteExercise = async (exerciseId: string) => {
        if (!selectedPlan) return;
        try {
            const exerciseToRemove = selectedPlan.exercises?.find(e => e.id === exerciseId);
            if (!exerciseToRemove) return;

            const updatedExercises = selectedPlan.exercises?.filter(e => e.id !== exerciseId) || [];
            await api(`/api/workout-plans/${selectedPlan.id}`, {
                method: 'PUT',
                body: { exercises: JSON.stringify(updatedExercises) }
            });

            // Update local state
            const updatedPlan = { ...selectedPlan, exercises: updatedExercises };
            setSelectedPlan(updatedPlan);
            setPlans(plans.map(p => p.id === selectedPlan.id ? updatedPlan : p));

        } catch (err) {
            console.error(err);
        }
    };

    const handleAssign = async (field: 'member_id' | 'trainer_id', value: string | null) => {
        if (!selectedPlan) return;
        try {
            await api(`/api/workout-plans/${selectedPlan.id}`, {
                method: 'PUT',
                body: { [field]: value }
            });
            setSelectedPlan(prev => (prev ? { ...prev, [field]: value } : prev));
            await fetchPlans();
            notify('Assignment updated', 'success');
        } catch (err) {
            console.error('Error updating assignment:', err);
            notify('Failed to update assignment', 'error');
        }
    };

    const handleMarkComplete = async () => {
        if (!selectedPlan) return;
        setItemLoading(true);
        try {
            const entry: WorkoutCompletion = { id: crypto.randomUUID(), date: new Date().toISOString() };
            await api(`/api/workout-plans/${selectedPlan.id}`, {
                method: 'PUT',
                body: { completions: JSON.stringify([...(selectedPlan.completions || []), entry]) }
            });
            const updatedPlan = {
                ...selectedPlan,
                completions: [...(selectedPlan.completions || []), entry]
            };
            setSelectedPlan(updatedPlan);
            setPlans(plans.map(p => p.id === selectedPlan.id ? updatedPlan : p));
            notify('Session marked complete', 'success');
        } catch (err) {
            console.error('Error logging session:', err);
            notify('Failed to log session', 'error');
        } finally {
            setItemLoading(false);
        }
    };

    const openDetails = (plan: WorkoutPlan) => {
        setSelectedPlan(plan);
        setShowDetailModal(true);
    };

    const detailStats = selectedPlan
        ? computeCompletionStats(selectedPlan.completions, selectedPlan.days_per_week)
        : null;
    const completionHistory = selectedPlan
        ? [...(selectedPlan.completions || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        : [];

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            {/* Header Block */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Workouts</h1>
                    <p className="text-slate-500 mt-1 text-base">Workout plans for members.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl border-slate-200 px-4 h-10 text-sm" icon={ListFilter}>
                        View All
                    </Button>
                    {canManage && (
                        <Button variant="primary" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 h-10 border-0 shadow-md text-sm" icon={Plus} onClick={() => setShowCreateModal(true)}>
                            New Plan
                        </Button>
                    )}
                </div>
            </div>

            {/* Plans List */}
            {loading ? (
                <div className="p-12 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 font-bold text-sm">Loading plans...</p>
                </div>
            ) : plans.length === 0 ? (
                <Card className="rounded-2xl border-slate-100 p-12 text-center shadow-lg shadow-slate-100">
                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Dumbbell className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">No Plans Found</h3>
                    <p className="text-slate-500 mt-1 text-sm">{canManage ? 'Start by creating your first workout plan.' : 'No workout plans have been created yet.'}</p>
                    {canManage && (
                        <Button variant="primary" className="mt-6 rounded-xl bg-slate-900 border-0 px-8 h-10 text-sm" icon={Plus} onClick={() => setShowCreateModal(true)}>
                            Add Plan
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const stats = computeCompletionStats(plan.completions, plan.days_per_week);
                        return (
                        <Card key={plan.id} className="rounded-2xl border-slate-100 shadow-xl hover:shadow-indigo-50 transition-all duration-300 group overflow-hidden bg-white">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="h-11 w-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
                                        <Dumbbell className="h-5 w-5" />
                                    </div>
                                    {canManage && (
                                        <button onClick={() => handleDeletePlan(plan.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{plan.name}</h3>
                                <p className="text-slate-500 text-xs font-medium mb-6 line-clamp-2 leading-relaxed">{plan.description || 'No description provided.'}</p>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    <div className="flex items-center text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                        <User className="h-3 w-3 mr-1.5" />
                                        {plan.member?.name || 'Public'}
                                    </div>
                                    <div className="flex items-center text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                        <Calendar className="h-3 w-3 mr-1.5" />
                                        {new Date(plan.created_at).toLocaleDateString()}
                                    </div>
                                    {plan.objective && (
                                        <div className="flex items-center text-[9px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">
                                            <Target className="h-3 w-3 mr-1.5" />
                                            {plan.objective}
                                        </div>
                                    )}
                                    {plan.level && (
                                        <div className="flex items-center text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                            <TrendingUp className="h-3 w-3 mr-1.5" />
                                            {plan.level}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Adherence</p>
                                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${stats.adherencePct}%` }} />
                                        </div>
                                        <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                            {stats.total} session{stats.total === 1 ? '' : 's'}{stats.lastDate ? ` · last ${new Date(stats.lastDate).toLocaleDateString()}` : ''}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Size</p>
                                        <p className="text-[10px] font-bold text-slate-900">{plan.exercises?.length || 0} Exercises</p>
                                    </div>
                                </div>

                                <Button className="w-full mt-6 rounded-xl py-3 flex items-center justify-between group/btn bg-slate-50 hover:bg-indigo-600 hover:text-white border-0 transition-all text-slate-900 font-bold uppercase tracking-widest text-[10px]" onClick={() => openDetails(plan)}>
                                    View Details
                                    <ChevronRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </Card>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <Card className="max-w-md w-full p-8 rounded-2xl border-0 shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-200 relative">
                        <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors">
                            <X className="h-5 w-5" />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">New Plan</h2>
                            <p className="text-slate-500 mt-1 text-sm">Create a new workout plan.</p>
                        </div>

                        <form onSubmit={handleCreatePlan} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Plan Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none text-sm transition-all"
                                    placeholder="e.g. Full Body"
                                    value={newPlan.name}
                                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Member</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none text-sm appearance-none"
                                        value={newPlan.member_id}
                                        onChange={(e) => setNewPlan({ ...newPlan, member_id: e.target.value })}
                                    >
                                        <option value="">Public Plan</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Trainer</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none text-sm appearance-none"
                                        value={newPlan.trainer_id}
                                        onChange={(e) => setNewPlan({ ...newPlan, trainer_id: e.target.value })}
                                    >
                                        <option value="">Unassigned</option>
                                        {trainers.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Objective</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none text-sm appearance-none"
                                        value={newPlan.objective}
                                        onChange={(e) => setNewPlan({ ...newPlan, objective: e.target.value })}
                                    >
                                        <option value="">Not set</option>
                                        {WORKOUT_OBJECTIVES.map(o => (
                                            <option key={o} value={o}>{o}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Level</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none text-sm appearance-none"
                                        value={newPlan.level}
                                        onChange={(e) => setNewPlan({ ...newPlan, level: e.target.value })}
                                    >
                                        <option value="">Not set</option>
                                        {WORKOUT_LEVELS.map(l => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Duration (weeks)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none text-sm transition-all"
                                        placeholder="e.g. 8"
                                        value={newPlan.weeks}
                                        onChange={(e) => setNewPlan({ ...newPlan, weeks: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Days / week</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={7}
                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none text-sm transition-all"
                                        placeholder="e.g. 3"
                                        value={newPlan.days_per_week}
                                        onChange={(e) => setNewPlan({ ...newPlan, days_per_week: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                <textarea
                                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none text-sm min-h-[80px]"
                                    placeholder="Plan details..."
                                    value={newPlan.description}
                                    onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" className="flex-1 rounded-xl py-3 text-xs" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-2 rounded-xl py-3 bg-indigo-600 border-0 shadow-lg text-xs" loading={itemLoading}>Add Plan</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Detail/Exercises Modal */}
            {showDetailModal && selectedPlan && (
                <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <Card className="max-w-4xl w-full p-0 rounded-2xl border-0 shadow-2xl bg-white overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                        <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
                            {/* Left Side: Plan Info & Form */}
                            <div className="w-full md:w-1/3 p-8 border-r border-slate-50 bg-slate-50/30 overflow-y-auto">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                        <Flame className="h-5 w-5" />
                                    </div>
                                    <button onClick={() => setShowDetailModal(false)} className="p-2 md:hidden"><X /></button>
                                </div>
                                <h2 className="text-xl font-black text-slate-900 leading-tight">{selectedPlan.name}</h2>
                                <p className="text-slate-400 font-medium mt-2 text-xs leading-relaxed">{selectedPlan.description}</p>

                                <div className="mt-8 space-y-6">
                                    {/* Programme metadata */}
                                    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center">
                                            <Target className="h-3 w-3 mr-1.5 text-indigo-500" />
                                            Programme
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Objective</p>
                                                <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedPlan.objective || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Level</p>
                                                <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedPlan.level || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Duration</p>
                                                <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedPlan.weeks ? `${selectedPlan.weeks} weeks` : '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Days / week</p>
                                                <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedPlan.days_per_week ? `${selectedPlan.days_per_week}x` : '—'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-50">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Adherence (28d)</span>
                                                <span className="text-[10px] font-black text-slate-900">{detailStats ? detailStats.adherencePct : 0}%</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${detailStats?.adherencePct ?? 0}%` }} />
                                            </div>
                                            <p className="text-[8px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">
                                                {detailStats?.total ?? 0} session{detailStats?.total === 1 ? '' : 's'} · {detailStats?.thisWeek ?? 0} this week
                                            </p>
                                        </div>
                                    </div>

                                    {/* Assignment */}
                                    {canManage && (
                                        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                            <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center">
                                                <UserCheck className="h-3 w-3 mr-1.5 text-indigo-500" />
                                                Assignment
                                            </h4>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Member</label>
                                                <select
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border-none focus:ring-4 focus:ring-indigo-50 appearance-none"
                                                    value={selectedPlan.member_id || ''}
                                                    onChange={e => handleAssign('member_id', e.target.value || null)}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {members.map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Trainer</label>
                                                <select
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border-none focus:ring-4 focus:ring-indigo-50 appearance-none"
                                                    value={selectedPlan.trainer_id || ''}
                                                    onChange={e => handleAssign('trainer_id', e.target.value || null)}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {trainers.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <Button type="button" variant="primary" className="w-full rounded-xl py-3 bg-indigo-600 text-[10px] font-bold uppercase tracking-widest" icon={CalendarCheck} loading={itemLoading} onClick={handleMarkComplete}>
                                                Mark session complete
                                            </Button>
                                        </div>
                                    )}

                                    {/* Add exercise */}
                                    {canManage && (
                                        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                            <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center">
                                                <Plus className="h-3 w-3 mr-1.5 text-indigo-500" />
                                                Add Exercise
                                            </h4>
                                            <form onSubmit={handleAddExercise} className="space-y-4">
                                                <input
                                                    type="text"
                                                    placeholder="Exercise"
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border-none focus:ring-4 focus:ring-indigo-50 transition-all"
                                                    required
                                                    value={newExercise.name}
                                                    onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}
                                                />
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Muscle group</label>
                                                    <select
                                                        className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border-none focus:ring-4 focus:ring-indigo-50 appearance-none"
                                                        value={newExercise.category}
                                                        onChange={e => setNewExercise({ ...newExercise, category: e.target.value })}
                                                    >
                                                        <option value="">Not set</option>
                                                        {MUSCLE_GROUPS.map(g => (
                                                            <option key={g} value={g}>{g}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Sets</label>
                                                        <input type="number" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border-none" value={newExercise.sets} onChange={e => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) })} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Reps</label>
                                                        <input type="number" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border-none" value={newExercise.reps} onChange={e => setNewExercise({ ...newExercise, reps: parseInt(e.target.value) })} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input type="text" placeholder="Weight" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border-none" value={newExercise.weight} onChange={e => setNewExercise({ ...newExercise, weight: e.target.value })} />
                                                    <input type="text" placeholder="Rest (e.g. 60s)" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border-none" value={newExercise.rest} onChange={e => setNewExercise({ ...newExercise, rest: e.target.value })} />
                                                </div>
                                                <Button type="submit" variant="primary" className="w-full rounded-xl py-3 bg-slate-900 text-[10px] font-bold uppercase tracking-widest" icon={Zap} loading={itemLoading}>
                                                    Add
                                                </Button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Exercise List */}
                            <div className="flex-1 p-8 md:p-10 bg-white overflow-y-auto">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">Exercises</h3>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Plan Sequence</p>
                                    </div>
                                    <button onClick={() => setShowDetailModal(false)} className="hidden md:block p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {!selectedPlan.exercises || selectedPlan.exercises.length === 0 ? (
                                        <div className="py-12 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                                            <Play className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                                            <p className="text-slate-400 font-bold text-sm">No exercises yet.</p>
                                        </div>
                                    ) : (
                                        selectedPlan.exercises.map((ex, idx) => (
                                            <div key={ex.id || idx} className="group p-4 bg-slate-50 hover:bg-white hover:shadow-lg rounded-2xl border border-transparent hover:border-indigo-50 transition-all items-center flex gap-4">
                                                <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center font-black text-indigo-600 shadow-sm text-xs">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <h5 className="font-bold text-slate-900 text-sm uppercase">{ex.name}</h5>
                                                    <div className="flex flex-wrap gap-3 mt-0.5">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{ex.sets} Sets</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{ex.reps} Reps</span>
                                                        {ex.weight && <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{ex.weight}</span>}
                                                        {ex.category && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{ex.category}</span>}
                                                        {ex.rest && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rest {ex.rest}</span>}
                                                    </div>
                                                </div>
                                                {canManage && (
                                                    <button onClick={() => ex.id && handleDeleteExercise(ex.id)} className="opacity-0 group-hover:opacity-100 p-2 bg-white text-slate-400 hover:text-red-500 rounded-lg transition-all shadow-sm">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Completion history */}
                                <div className="mt-10">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">Completion history</h3>
                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Logged sessions</p>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                                            {detailStats?.total ?? 0} total
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {completionHistory.length === 0 ? (
                                            <div className="py-8 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                                                <CalendarCheck className="h-7 w-7 text-slate-200 mx-auto mb-2" />
                                                <p className="text-slate-400 font-bold text-sm">No sessions logged yet.</p>
                                            </div>
                                        ) : (
                                            completionHistory.map((c) => (
                                                <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                                    <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                                                        <CalendarCheck className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-slate-900">{new Date(c.date).toLocaleDateString()}</p>
                                                        {c.note && <p className="text-[10px] text-slate-400 mt-0.5">{c.note}</p>}
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {new Date(c.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="mt-10 flex justify-end">
                                    <Button variant="outline" className="rounded-xl px-8 py-3 font-bold uppercase tracking-widest text-[9px] border-slate-100 bg-slate-50" onClick={() => setShowDetailModal(false)}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default WorkoutPlans;
