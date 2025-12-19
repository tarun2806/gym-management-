
import React, { useState, useEffect } from 'react';
import {
    ShieldCheck,
    Plus,
    Check,
    X,
    Edit,
    Trash2,
    DollarSign,
    Clock,
    Zap,
    Star,
    Crown
} from 'lucide-react';
import { Button } from '../components';
import { supabase } from '../lib/supabase';

interface MembershipPlan {
    id: number;
    name: string;
    price: number;
    duration: string;
    features: string[];
    status: string;
}

const MembershipPlans: React.FC = () => {
    const [plans, setPlans] = useState<MembershipPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Form State
    const [newPlan, setNewPlan] = useState({
        name: '',
        price: '',
        duration: '1 month',
        features: [''],
        status: 'active'
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('membership_plans')
                .select('*')
                .order('price', { ascending: true });

            if (error) throw error;
            setPlans(data || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const { error } = await supabase
                .from('membership_plans')
                .insert([{
                    name: newPlan.name,
                    price: parseFloat(newPlan.price),
                    duration: newPlan.duration,
                    features: newPlan.features.filter(f => f.trim() !== ''),
                    status: newPlan.status
                }]);

            if (error) throw error;
            setShowAddModal(false);
            setNewPlan({ name: '', price: '', duration: '1 month', features: [''], status: 'active' });
            fetchPlans();
        } catch (error: any) {
            alert(`Failed to create plan: ${error.message}`);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDeletePlan = async (id: number) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        try {
            const { error } = await supabase.from('membership_plans').delete().eq('id', id);
            if (error) throw error;
            fetchPlans();
        } catch (error: any) {
            alert(`Delete failed: ${error.message}`);
        }
    };

    const addFeatureInput = () => {
        setNewPlan({ ...newPlan, features: [...newPlan.features, ''] });
    };

    const removeFeatureInput = (index: number) => {
        const updated = newPlan.features.filter((_, i) => i !== index);
        setNewPlan({ ...newPlan, features: updated });
    };

    const updateFeatureInput = (index: number, value: string) => {
        const updated = [...newPlan.features];
        updated[index] = value;
        setNewPlan({ ...newPlan, features: updated });
    };

    const getPlanIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('pro') || n.includes('premium')) return Star;
        if (n.includes('gold') || n.includes('vip') || n.includes('annual')) return Crown;
        return Zap;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Membership Tiers</h1>
                    <p className="text-gray-600">Design flexible plans and pricing models for your members</p>
                </div>
                <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>
                    Create New Plan
                </Button>
            </div>

            {loading ? (
                <div className="py-20 text-center text-gray-400">Loading plans...</div>
            ) : plans.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                    <ShieldCheck className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No membership tiers configured yet.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setShowAddModal(true)}>Add Your First Tier</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map((plan) => {
                        const Icon = getPlanIcon(plan.name);
                        return (
                            <div key={plan.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group">
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div className="flex space-x-1">
                                            <button className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg transition-colors"><Edit className="h-4 w-4" /></button>
                                            <button onClick={() => handleDeletePlan(plan.id)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline mb-6">
                                        <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                                        <span className="text-gray-500 ml-2 font-medium">/ {plan.duration}</span>
                                    </div>

                                    <div className="space-y-4 mb-8 flex-grow">
                                        {plan.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center text-gray-600 text-sm">
                                                <div className="h-5 w-5 bg-green-50 text-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                                {feature}
                                            </div>
                                        ))}
                                    </div>

                                    <Button variant="outline" className="w-full rounded-2xl border-gray-200 text-gray-900 hover:bg-gray-50 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                                        Selected by {Math.floor(Math.random() * 40)} Members
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Plan Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 outline-none"><X className="h-6 w-6" /></button>
                        <h2 className="text-3xl font-bold text-gray-900 mb-8">New Membership Tier</h2>

                        <form onSubmit={handleCreatePlan} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Plan Name</label>
                                    <input required placeholder="e.g. Platinum Annual" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50/50 outline-none focus:ring-4 focus:ring-blue-100" value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Price ($)</label>
                                        <input required type="number" placeholder="99.99" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50/50 outline-none focus:ring-4 focus:ring-blue-100" value={newPlan.price} onChange={e => setNewPlan({ ...newPlan, price: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Duration</label>
                                        <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50/50 outline-none focus:ring-4 focus:ring-blue-100" value={newPlan.duration} onChange={e => setNewPlan({ ...newPlan, duration: e.target.value })}>
                                            <option value="1 month">Monthly</option>
                                            <option value="3 months">Quarterly</option>
                                            <option value="annual">Annual</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Features & Perks</label>
                                    <div className="space-y-3">
                                        {newPlan.features.map((f, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input required placeholder="Access to sauna..." className="flex-1 p-2 text-sm border border-gray-200 rounded-lg bg-gray-50/50 outline-none" value={f} onChange={e => updateFeatureInput(i, e.target.value)} />
                                                <button type="button" onClick={() => removeFeatureInput(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X className="h-4 w-4" /></button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={addFeatureInput} className="text-blue-600 text-sm font-bold flex items-center hover:underline"><Plus className="h-4 w-4 mr-1" /> Add Feature</button>
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setShowAddModal(false)}>Cancel</Button>
                                    <Button type="submit" variant="primary" className="flex-1 rounded-xl shadow-lg shadow-blue-200" loading={submitLoading}>Save Plan</Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembershipPlans;
