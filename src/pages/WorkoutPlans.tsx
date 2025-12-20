
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
    Zap
} from 'lucide-react';
import { Button, Card } from '../components';
import { supabase } from '../lib/supabase';

interface Exercise {
    id?: number;
    plan_id?: number;
    name: string;
    sets: number;
    reps: number;
    weight: string;
    notes: string;
}

interface Member {
    id: number;
    name: string;
}

interface WorkoutPlan {
    id: number;
    name: string;
    description: string;
    member_id: number | null;
    exercises?: Exercise[];
    created_at: string;
    member?: { name: string };
}

const WorkoutPlans: React.FC = () => {
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);

    // Create Plan Form
    const [newPlan, setNewPlan] = useState({
        name: '',
        description: '',
        member_id: ''
    });

    // Exercise Form
    const [newExercise, setNewExercise] = useState<Exercise>({
        name: '',
        sets: 3,
        reps: 12,
        weight: '',
        notes: ''
    });
    const [itemLoading, setItemLoading] = useState(false);

    useEffect(() => {
        fetchPlans();
        fetchMembers();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('workout_plans')
                .select('*, member:members(name), exercises:workout_exercises(*)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPlans(data || []);
        } catch (err) {
            console.error('Error fetching plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('id, name')
                .eq('status', 'Active');
            if (error) throw error;
            setMembers(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setItemLoading(true);
        try {
            const { error } = await supabase
                .from('workout_plans')
                .insert([{
                    name: newPlan.name,
                    description: newPlan.description,
                    member_id: newPlan.member_id ? parseInt(newPlan.member_id) : null
                }]);

            if (error) throw error;

            setNewPlan({ name: '', description: '', member_id: '' });
            setShowCreateModal(false);
            fetchPlans();
        } catch (err) {
            console.error('Error creating plan:', err);
            alert('Failed to create plan');
        } finally {
            setItemLoading(false);
        }
    };

    const handleDeletePlan = async (id: number) => {
        if (!confirm('Are you sure you want to delete this workout plan?')) return;

        try {
            const { error } = await supabase
                .from('workout_plans')
                .delete()
                .eq('id', id);

            if (error) throw error;
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
            const { error } = await supabase
                .from('workout_exercises')
                .insert([{ ...newExercise, plan_id: selectedPlan.id }]);

            if (error) throw error;

            setNewExercise({ name: '', sets: 3, reps: 12, weight: '', notes: '' });
            // Refresh plan details
            const { data: updatedPlan } = await supabase
                .from('workout_plans')
                .select('*, member:members(name), exercises:workout_exercises(*)')
                .eq('id', selectedPlan.id)
                .single();

            if (updatedPlan) setSelectedPlan(updatedPlan);
            fetchPlans();
        } catch (err) {
            console.error(err);
            alert('Failed to add exercise');
        } finally {
            setItemLoading(false);
        }
    };

    const handleDeleteExercise = async (id: number) => {
        try {
            const { error } = await supabase
                .from('workout_exercises')
                .delete()
                .eq('id', id);
            if (error) throw error;

            if (selectedPlan) {
                const { data: updatedPlan } = await supabase
                    .from('workout_plans')
                    .select('*, member:members(name), exercises:workout_exercises(*)')
                    .eq('id', selectedPlan.id)
                    .single();
                if (updatedPlan) setSelectedPlan(updatedPlan);
            }
            fetchPlans();
        } catch (err) {
            console.error(err);
        }
    };

    const openDetails = (plan: WorkoutPlan) => {
        setSelectedPlan(plan);
        setShowDetailModal(true);
    };

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
                    <Button variant="primary" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 h-10 border-0 shadow-md text-sm" icon={Plus} onClick={() => setShowCreateModal(true)}>
                        New Plan
                    </Button>
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
                    <p className="text-slate-500 mt-1 text-sm">Start by creating your first workout plan.</p>
                    <Button variant="primary" className="mt-6 rounded-xl bg-slate-900 border-0 px-8 h-10 text-sm" icon={Plus} onClick={() => setShowCreateModal(true)}>
                        Add Plan
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <Card key={plan.id} className="rounded-2xl border-slate-100 shadow-xl hover:shadow-indigo-50 transition-all duration-300 group overflow-hidden bg-white">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="h-11 w-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
                                        <Dumbbell className="h-5 w-5" />
                                    </div>
                                    <button onClick={() => handleDeletePlan(plan.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
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
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Status</p>
                                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 w-[70%]" />
                                        </div>
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
                    ))}
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
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Member (Optional)</label>
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
                                            <input type="text" placeholder="Weight" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border-none" value={newExercise.weight} onChange={e => setNewExercise({ ...newExercise, weight: e.target.value })} />
                                            <Button type="submit" variant="primary" className="w-full rounded-xl py-3 bg-slate-900 text-[10px] font-bold uppercase tracking-widest" icon={Zap} loading={itemLoading}>
                                                Add
                                            </Button>
                                        </form>
                                    </div>
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
                                                    <div className="flex gap-3 mt-0.5">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{ex.sets} Sets</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{ex.reps} Reps</span>
                                                        {ex.weight && <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{ex.weight}</span>}
                                                    </div>
                                                </div>
                                                <button onClick={() => ex.id && handleDeleteExercise(ex.id)} className="opacity-0 group-hover:opacity-100 p-2 bg-white text-slate-400 hover:text-red-500 rounded-lg transition-all shadow-sm">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
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

