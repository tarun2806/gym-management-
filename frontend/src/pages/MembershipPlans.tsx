
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
    ShieldCheck,
    Power,
    Sparkles,
    Users
} from 'lucide-react';
import { Button, Card } from '../components';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { api } from '../lib/api';
import { logAudit } from '../lib/audit';
import { memberService } from '../lib/services';
import { useCurrency } from '../lib/currency';
import type { MembershipPlan } from '../types';
import {
    PLAN_DURATIONS,
    DEFAULT_PLANS,
    isPlanActive,
    validatePlan,
} from '../lib/plans';

type StatusFilter = 'all' | 'active' | 'inactive';

const MembershipPlans: React.FC = () => {
    const { notify } = useToast();
    const { user } = useAuth();
    const { currentOrganization } = useOrganization();
    const currency = useCurrency();
    const [plans, setPlans] = useState<MembershipPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editPlan, setEditPlan] = useState<MembershipPlan | null>(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [seeding, setSeeding] = useState(false);

    // planId -> how many members reference it, and name -> count (legacy members
    // that store membership_type without a plan_id).
    const [refById, setRefById] = useState<Record<string, number>>({});
    const [refByName, setRefByName] = useState<Record<string, number>>({});

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
            if (!currentOrganization) {
                setPlans([]);
                setLoading(false);
                return;
            }
            const scope = { orgId: currentOrganization.id };
            const [planRows, members] = await Promise.all([
                api<Record<string, unknown>[]>('/api/membership-plans', { scope }),
                memberService.list(scope),
            ]);
            const data = planRows.map(row => {
                let features = row.features;
                if (typeof features === 'string') {
                    try { features = JSON.parse(features); } catch { features = []; }
                }
                return { id: String(row.id), ...(row as object), features } as MembershipPlan;
            });
            setPlans(data);

            const byId: Record<string, number> = {};
            const byName: Record<string, number> = {};
            members.forEach(m => {
                if (m.plan_id) byId[m.plan_id] = (byId[m.plan_id] || 0) + 1;
                if (m.membership_type) byName[m.membership_type] = (byName[m.membership_type] || 0) + 1;
            });
            setRefById(byId);
            setRefByName(byName);
        } catch (err) {
            console.error('Error fetching plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const referenceCount = (plan: MembershipPlan) =>
        (refById[plan.id] || 0) + (refByName[plan.name] || 0);

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrganization) {
            notify('Please select an organization first', 'error');
            return;
        }
        const result = validatePlan(newPlan);
        if (!result.ok) {
            notify(result.error, 'error');
            return;
        }
        setSubmitLoading(true);
        try {
            await api('/api/membership-plans', {
                method: 'POST',
                scope: { orgId: currentOrganization.id },
                body: {
                    ...result.value,
                    status: newPlan.status,
                    features: JSON.stringify(result.value.features ?? []),
                }
            });

            setShowAddModal(false);
            setNewPlan({ name: '', price: '', duration: '1 month', features: [''], status: 'active' });
            fetchPlans();
            notify('Plan created', 'success');
        } catch (error: unknown) {
            notify(`Failed to create plan: ${(error as Error).message}`, 'error');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan? This cannot be undone.')) return;
        try {
            await api(`/api/membership-plans/${id}`, {
                method: 'DELETE',
                scope: { orgId: currentOrganization?.id },
            });
            await logAudit('warning', `Plan deleted: ID ${id}`, user?.username || 'staff', 'plan_delete');
            fetchPlans();
            notify('Plan deleted', 'success');
        } catch (error: unknown) {
            notify(`Failed to delete plan: ${(error as Error).message}`, 'error');
        }
    };

    const handleToggleStatus = async (plan: MembershipPlan) => {
        const next = isPlanActive(plan) ? 'inactive' : 'active';
        try {
            await api(`/api/membership-plans/${plan.id}`, {
                method: 'PUT',
                scope: { orgId: currentOrganization?.id },
                body: { status: next },
            });
            await logAudit('info', `Plan ${next}: ${plan.name}`, user?.username || 'staff', `plan_lifecycle_${next}`);
            fetchPlans();
            notify(next === 'inactive' ? 'Plan deactivated' : 'Plan activated', 'success');
        } catch (error: unknown) {
            notify(`Failed to update status: ${(error as Error).message}`, 'error');
        }
    };

    const handleSeedDefaults = async () => {
        setSeeding(true);
        try {
            const existing = new Set(plans.map(p => p.name.toLowerCase()));
            const toCreate = DEFAULT_PLANS.filter(p => !existing.has(p.name.toLowerCase()));
            for (const plan of toCreate) {
                await api('/api/membership-plans', {
                    method: 'POST',
                    scope: { orgId: currentOrganization?.id },
                    body: { ...plan, features: JSON.stringify(plan.features ?? []) },
                });
            }
            fetchPlans();
            notify(toCreate.length > 0 ? `Seeded ${toCreate.length} standard tiers` : 'Standard tiers already present', 'success');
        } catch (error: unknown) {
            notify(`Failed to seed plans: ${(error as Error).message}`, 'error');
        } finally {
            setSeeding(false);
        }
    };

    const openEditModal = (plan: MembershipPlan) => {
        setEditPlan({ ...plan, features: [...(plan.features || [])] });
        setShowEditModal(true);
    };

    const handleUpdatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editPlan) return;
        const result = validatePlan(editPlan);
        if (!result.ok) {
            notify(result.error, 'error');
            return;
        }
        setSubmitLoading(true);
        try {
            await api(`/api/membership-plans/${editPlan.id}`, {
                method: 'PUT',
                scope: { orgId: currentOrganization?.id },
                body: {
                    ...result.value,
                    status: editPlan.status,
                    features: JSON.stringify(result.value.features ?? []),
                },
            });
            setShowEditModal(false);
            setEditPlan(null);
            fetchPlans();
            notify('Plan updated', 'success');
        } catch (error: unknown) {
            notify(`Failed to update plan: ${(error as Error).message}`, 'error');
        } finally {
            setSubmitLoading(false);
        }
    };

    const getPlanIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('premium') || n.includes('gold')) return Crown;
        if (n.includes('pro') || n.includes('silver')) return Star;
        if (n.includes('basic') || n.includes('bronze')) return Award;
        return Zap;
    };

    const filteredPlans = plans.filter(p =>
        statusFilter === 'all' ? true : statusFilter === 'active' ? isPlanActive(p) : !isPlanActive(p)
    );

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

            {plans.length === 0 ? (
                <Card className="rounded-3xl border-4 border-dashed border-slate-100 p-16 text-center bg-white">
                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Crown className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">No plans yet</h3>
                    <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto font-medium">Create a tier manually, or start from a set of standard membership tiers you can edit later.</p>
                    <div className="flex flex-wrap gap-3 justify-center mt-8">
                        <Button variant="primary" className="rounded-xl px-6 h-12" icon={Plus} onClick={() => setShowAddModal(true)}>New Plan</Button>
                        <Button variant="outline" className="rounded-xl px-6 h-12" icon={Sparkles} onClick={handleSeedDefaults} loading={seeding}>Seed standard tiers</Button>
                    </div>
                </Card>
            ) : (
                <>
                    <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner border border-slate-200 w-fit">
                        {(['all', 'active', 'inactive'] as StatusFilter[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {filteredPlans.length === 0 ? (
                        <Card className="rounded-3xl border-slate-100 p-16 text-center bg-white">
                            <h3 className="text-xl font-black text-slate-900">No {statusFilter} plans</h3>
                            <p className="text-slate-400 mt-2 text-sm font-medium">Try a different status filter.</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredPlans.map((plan) => {
                                const Icon = getPlanIcon(plan.name);
                                const active = isPlanActive(plan);
                                const refs = referenceCount(plan);
                                const inUse = refs > 0;
                                return (
                                    <Card key={plan.id} className={`rounded-3xl border-0 shadow-xl shadow-slate-200/40 bg-white overflow-hidden flex flex-col group hover:-translate-y-1 transition-all ${active ? '' : 'opacity-70'}`}>
                                        <div className="p-8 pb-0">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openEditModal(plan)} title="Edit" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit className="h-4 w-4" /></button>
                                                    <button
                                                        onClick={() => handleToggleStatus(plan)}
                                                        title={active ? 'Deactivate plan' : 'Activate plan'}
                                                        className={`p-2 transition-colors ${active ? 'text-slate-400 hover:text-amber-600' : 'text-slate-400 hover:text-emerald-600'}`}
                                                    >
                                                        <Power className="h-4 w-4" />
                                                    </button>
                                                    {!inUse && (
                                                        <button onClick={() => handleDeletePlan(plan.id)} title="Delete" className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                                                {!active && (
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest">Inactive</span>
                                                )}
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-slate-900 tracking-tight">{currency.format(plan.price)}</span>
                                                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">/ {plan.duration}</span>
                                            </div>
                                        </div>

                                        <div className="p-8 flex-1">
                                            <ul className="space-y-3">
                                                {(plan.features || []).map((feature, idx) => (
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
                                            {inUse && (
                                                <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-3">
                                                    <Users className="h-3 w-3" /> In use by {refs} member{refs > 1 ? 's' : ''} — delete disabled, deactivate instead.
                                                </p>
                                            )}
                                            <Button variant="outline" className="w-full rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-all" icon={ArrowRight}>Plan Details</Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

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
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price ({currency.symbol})</label>
                                    <input
                                        type="number"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                                        placeholder="2999"
                                        value={newPlan.price}
                                        onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration</label>
                                    <select
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-900"
                                        value={newPlan.duration}
                                        onChange={(e) => setNewPlan({ ...newPlan, duration: e.target.value })}
                                    >
                                        {PLAN_DURATIONS.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                    <select
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-900"
                                        value={newPlan.status}
                                        onChange={(e) => setNewPlan({ ...newPlan, status: e.target.value })}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
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

            {showEditModal && editPlan && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 text-slate-900">
                    <Card className="w-full max-w-lg bg-white rounded-3xl border-0 shadow-3xl p-10 relative">
                        <button onClick={() => { setShowEditModal(false); setEditPlan(null); }} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                            <X className="h-6 w-6 text-slate-400" />
                        </button>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Edit Plan</h3>
                        <p className="text-slate-500 font-medium mb-10 text-sm">Update this membership tier.</p>

                        <form onSubmit={handleUpdatePlan} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan Name</label>
                                    <input
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                                        value={editPlan.name}
                                        onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price ({currency.symbol})</label>
                                    <input
                                        type="number"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                                        value={editPlan.price}
                                        onChange={(e) => setEditPlan({ ...editPlan, price: Number(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration</label>
                                    <select
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-900"
                                        value={editPlan.duration}
                                        onChange={(e) => setEditPlan({ ...editPlan, duration: e.target.value })}
                                    >
                                        {PLAN_DURATIONS.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                    <select
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-900"
                                        value={editPlan.status}
                                        onChange={(e) => setEditPlan({ ...editPlan, status: e.target.value })}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Features</label>
                                {editPlan.features.map((feature, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            className="flex-1 px-6 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                                            value={feature}
                                            onChange={(e) => {
                                                const updated = [...editPlan.features];
                                                updated[idx] = e.target.value;
                                                setEditPlan({ ...editPlan, features: updated });
                                            }}
                                        />
                                        {idx > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = [...editPlan.features];
                                                    updated.splice(idx, 1);
                                                    setEditPlan({ ...editPlan, features: updated });
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
                                    onClick={() => setEditPlan({ ...editPlan, features: [...editPlan.features, ''] })}
                                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 hover:text-indigo-700 transition-colors"
                                >
                                    + Add Feature
                                </button>
                            </div>

                            <Button type="submit" variant="primary" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" loading={submitLoading}>Update Plan</Button>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default MembershipPlans;
