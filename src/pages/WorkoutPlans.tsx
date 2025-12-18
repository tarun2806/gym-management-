
import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, Dumbbell, Calendar, Info, Trash2 } from 'lucide-react';
import { Button } from '../components';
import { supabase } from '../lib/supabase';

// Helper interface for local state
interface Exercise {
    id?: number;
    name: string;
    sets: number;
    reps: number;
    weight: string;
    notes: string;
}

interface WorkoutPlan {
    id: number;
    name: string;
    description: string;
    exercises?: Exercise[];
    created_at: string;
}

const WorkoutPlans: React.FC = () => {
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create Plan Form
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanDescription, setNewPlanDescription] = useState('');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const { data: plansData, error } = await supabase
                .from('workout_plans')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching plans:', error);
            } else {
                setPlans(plansData || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('workout_plans')
                .insert([{ name: newPlanName, description: newPlanDescription }]);

            if (error) throw error;

            setNewPlanName('');
            setNewPlanDescription('');
            setShowCreateModal(false);
            fetchPlans();
        } catch (err) {
            console.error('Error creating plan:', err);
            alert('Failed to create plan');
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Workout Plans</h1>
                    <p className="text-gray-600">Create and manage workout routines.</p>
                </div>
                <Button variant="primary" icon={Plus} onClick={() => setShowCreateModal(true)}>
                    Create Workout
                </Button>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading plans...</div>
            ) : plans.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
                    <Dumbbell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No workout plans yet</h3>
                    <p className="text-gray-500 mb-6">Get started by creating your first workout routine.</p>
                    <Button variant="primary" icon={Plus} onClick={() => setShowCreateModal(true)}>
                        Create Workout
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-blue-100 p-2 rounded-lg">
                                        <Dumbbell className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <button
                                        onClick={() => handleDeletePlan(plan.id)}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{plan.description || 'No description provided.'}</p>

                                <div className="flex items-center text-sm text-gray-500 mb-6">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    {new Date(plan.created_at).toLocaleDateString()}
                                </div>

                                <Button className="w-full justify-between group">
                                    View Details
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Workout</h2>
                        <form onSubmit={handleCreatePlan} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Workout Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                    placeholder="e.g., Full Body Strength"
                                    value={newPlanName}
                                    onChange={(e) => setNewPlanName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                    rows={3}
                                    placeholder="Brief description of the workout goal..."
                                    value={newPlanDescription}
                                    onChange={(e) => setNewPlanDescription(e.target.value)}
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" className="flex-1">
                                    Create Plan
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkoutPlans;
