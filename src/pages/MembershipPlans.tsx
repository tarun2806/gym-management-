
import React, { useState, useEffect } from 'react';
import {
    Plus,
    Check,
    X,
    Edit,
    Trash2,
    Zap,
    Star,
    Crown,
    ArrowRight,
    Award,
    ShieldCheck
} from 'lucide-react';
import { Button, Card } from '../components';
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
        } catch (err) {
            console.error('Error fetching plans:', err);
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
        } catch (error: unknown) {
            alert(`Failed to create plan: ${(error as Error).message}`);
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
        } catch (error: unknown) {
            alert(`Failed to delete plan: ${(error as Error).message}`);
        }
    };

    const getPlanIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('premium') || n.includes('gold')) return Crown;
        if (n.includes('pro') || n.includes('silver')) return Star;
        if (n.includes('basic') || n.includes('bronze')) return Award;
        return Zap;
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <ShieldCheck className="h-10 w-10 text-slate-900 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Membership Plans</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage gym membership tiers and pricing.</p>
                </div>
                <Button variant="primary" className="rounded-xl px-6 h-12" icon={Plus} onClick={() => setShowAddModal(true)}>New Plan</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {plans.map((plan) => {
                    const Icon = getPlanIcon(plan.name);
                    return (
                        <Card key={plan.id} className="rounded-3xl border-0 shadow-xl shadow-slate-200/40 bg-white overflow-hidden flex flex-col group hover:-translate-y-1 transition-all">
                            <div className="p-8 pb-0">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="h-12 w-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit className="h-4 w-4" /></button>
                                        <button onClick={() => handleDeletePlan(plan.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-slate-900 tracking-tight">₹{plan.price}</span>
                                    <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">/ {plan.duration}</span>
                                </div>
                            </div>

                            <div className="p-8 flex-1">
                                <ul className="space-y-3">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                            <div className="h-5 w-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                                                <Check className="h-3 w-3" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-8 pt-0 mt-auto">
                                <Button variant="outline" className="w-full rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-all" icon={ArrowRight}>Plan Details</Button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 text-slate-900">
                    <Card className="w-full max-w-lg bg-white rounded-3xl border-0 shadow-3xl p-10 relative">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                            <X className="h-6 w-6 text-slate-400" />
                        </button>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Create Plan</h3>
                        <p className="text-slate-500 font-medium mb-10 text-sm">Add a new membership tier.</p>

                        <form onSubmit={handleCreatePlan} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan Name</label>
                                    <input
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                                        placeholder="e.g. Gold"
                                        value={newPlan.name}
                                        onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                                        placeholder="2999"
                                        value={newPlan.price}
                                        onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration</label>
                                <select
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-900"
                                    value={newPlan.duration}
                                    onChange={(e) => setNewPlan({ ...newPlan, duration: e.target.value })}
                                >
                                    <option value="1 month">1 Month</option>
                                    <option value="3 months">3 Months</option>
                                    <option value="6 months">6 Months</option>
                                    <option value="1 year">1 Year</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Features</label>
                                {newPlan.features.map((feature, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            className="flex-1 px-6 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                                            placeholder="Feature"
                                            value={feature}
                                            onChange={(e) => {
                                                const updated = [...newPlan.features];
                                                updated[idx] = e.target.value;
                                                setNewPlan({ ...newPlan, features: updated });
                                            }}
                                        />
                                        {idx > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = [...newPlan.features];
                                                    updated.splice(idx, 1);
                                                    setNewPlan({ ...newPlan, features: updated });
                                                }}
                                                className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setNewPlan({ ...newPlan, features: [...newPlan.features, ''] })}
                                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 hover:text-indigo-700 transition-colors"
                                >
                                    + Add Feature
                                </button>
                            </div>

                            <Button type="submit" variant="primary" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" loading={submitLoading}>Save Plan</Button>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default MembershipPlans;
