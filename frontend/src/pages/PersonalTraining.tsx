import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Dumbbell, Calendar, X, CheckCircle } from 'lucide-react';
import { Button, Card } from '../components';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { api } from '../lib/api';
import type { PTPackage, PTSession } from '../types';

const PersonalTraining: React.FC = () => {
  const { notify } = useToast();
  const { can } = useAuth();
  const { currentOrganization, currentBranch } = useOrganization();
  const [packages, setPackages] = useState<PTPackage[]>([]);
  const [sessions, setSessions] = useState<PTSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'packages' | 'sessions'>('packages');
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    sessions: 10,
    price: 500,
    duration_days: 30,
    status: 'active' as 'active' | 'inactive'
  });

  const [newSession, setNewSession] = useState({
    package_id: '',
    member_id: '',
    trainer_id: '',
    scheduled_date: '',
    scheduled_time: '09:00',
    notes: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchPackages = useCallback(async () => {
    if (!currentOrganization) return;
    try {
      setLoading(true);
      const rows = await api<Record<string, unknown>[]>('/api/pt-packages', {
        scope: { orgId: currentOrganization.id },
      });
      setPackages(rows.map(r => ({ id: String(r.id), ...(r as object) }) as PTPackage));
    } catch (err) {
      console.error('Error fetching PT packages:', err);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  const fetchSessions = useCallback(async () => {
    if (!currentOrganization) return;
    try {
      const rows = await api<Record<string, unknown>[]>('/api/pt-sessions', {
        scope: { orgId: currentOrganization.id },
      });
      setSessions(rows.map(r => ({ id: String(r.id), ...(r as object) }) as PTSession));
    } catch (err) {
      console.error('Error fetching PT sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    if (currentOrganization) {
      fetchPackages();
      fetchSessions();
    }
  }, [currentOrganization, fetchPackages, fetchSessions]);

  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) return;
    setSubmitLoading(true);
    try {
      await api('/api/pt-packages', {
        method: 'POST',
        scope: { orgId: currentOrganization.id, branchId: currentBranch?.id },
        body: newPackage
      });

      setShowPackageModal(false);
      setNewPackage({
        name: '',
        description: '',
        sessions: 10,
        price: 500,
        duration_days: 30,
        status: 'active'
      });
      fetchPackages();
      notify('PT package created', 'success');
    } catch (err: unknown) {
      notify(`Failed to create package: ${(err as Error).message}`, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) return;
    setSubmitLoading(true);
    try {
      await api('/api/pt-sessions', {
        method: 'POST',
        scope: { orgId: currentOrganization.id, branchId: currentBranch?.id },
        body: { ...newSession, status: 'scheduled' }
      });

      setShowSessionModal(false);
      setNewSession({
        package_id: '',
        member_id: '',
        trainer_id: '',
        scheduled_date: '',
        scheduled_time: '09:00',
        notes: ''
      });
      fetchSessions();
      notify('PT session scheduled', 'success');
    } catch (err: unknown) {
      notify(`Failed to schedule session: ${(err as Error).message}`, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCompleteSession = async (session: PTSession) => {
    try {
      await api(`/api/pt-sessions/${session.id}/status`, {
        method: 'PATCH',
        scope: { orgId: currentOrganization?.id },
        body: { status: 'completed' },
      });
      fetchSessions();
      notify('Session completed', 'success');
    } catch (err: unknown) {
      notify(`Failed to complete session: ${(err as Error).message}`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <p className="text-slate-500 font-bold">Please select an organization first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Personal Training</h1>
        <div className="flex gap-2">
          <Button variant={activeTab === 'packages' ? 'primary' : 'outline'} onClick={() => setActiveTab('packages')} icon={Dumbbell}>Packages</Button>
          <Button variant={activeTab === 'sessions' ? 'primary' : 'outline'} onClick={() => setActiveTab('sessions')} icon={Calendar}>Sessions</Button>
          {activeTab === 'packages' && can('trainers.create') && (
            <Button variant="primary" icon={Plus} onClick={() => setShowPackageModal(true)}>Add Package</Button>
          )}
          {activeTab === 'sessions' && can('trainers.create') && (
            <Button variant="primary" icon={Plus} onClick={() => setShowSessionModal(true)}>Schedule Session</Button>
          )}
        </div>
      </div>

      {activeTab === 'packages' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="rounded-2xl border-0 shadow-xl bg-white p-6">
              <div className="flex justify-between items-start mb-4">
                <Dumbbell className="h-10 w-10 text-slate-900" />
                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${pkg.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {pkg.status}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900">{pkg.name}</h3>
              <p className="text-slate-500 text-sm mt-1">{pkg.description}</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sessions:</span>
                  <span className="font-bold">{pkg.sessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Price:</span>
                  <span className="font-bold">${pkg.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-bold">{pkg.duration_days} days</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className="rounded-xl border-0 shadow bg-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Calendar className="h-8 w-8 text-slate-400" />
                <div>
                  <p className="font-bold text-slate-900">{session.scheduled_date} at {session.scheduled_time}</p>
                  <p className="text-xs text-slate-500">Session with Trainer ID: {session.trainer_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                  session.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                  session.status === 'cancelled' ? 'bg-rose-50 text-rose-700' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {session.status}
                </span>
                {session.status === 'scheduled' && (
                  <Button variant="primary" size="sm" onClick={() => handleCompleteSession(session)} icon={CheckCircle}>Complete</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showPackageModal && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full p-6 rounded-2xl bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add PT Package</h2>
              <button onClick={() => setShowPackageModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddPackage} className="space-y-4">
              <input className="w-full p-3 border rounded-xl" placeholder="Name" value={newPackage.name} onChange={e => setNewPackage({ ...newPackage, name: e.target.value })} required />
              <textarea className="w-full p-3 border rounded-xl" placeholder="Description" value={newPackage.description} onChange={e => setNewPackage({ ...newPackage, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" className="w-full p-3 border rounded-xl" placeholder="Sessions" value={newPackage.sessions} onChange={e => setNewPackage({ ...newPackage, sessions: parseInt(e.target.value) })} required />
                <input type="number" className="w-full p-3 border rounded-xl" placeholder="Price" value={newPackage.price} onChange={e => setNewPackage({ ...newPackage, price: parseInt(e.target.value) })} required />
                <input type="number" className="w-full p-3 border rounded-xl" placeholder="Duration (days)" value={newPackage.duration_days} onChange={e => setNewPackage({ ...newPackage, duration_days: parseInt(e.target.value) })} required />
              </div>
              <Button type="submit" variant="primary" loading={submitLoading}>Create</Button>
            </form>
          </Card>
        </div>
      )}

      {showSessionModal && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full p-6 rounded-2xl bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Schedule Session</h2>
              <button onClick={() => setShowSessionModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddSession} className="space-y-4">
              <select className="w-full p-3 border rounded-xl" value={newSession.package_id} onChange={e => setNewSession({ ...newSession, package_id: e.target.value })} required>
                <option value="">Select Package</option>
                {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className="w-full p-3 border rounded-xl" placeholder="Member ID" value={newSession.member_id} onChange={e => setNewSession({ ...newSession, member_id: e.target.value })} required />
              <input className="w-full p-3 border rounded-xl" placeholder="Trainer ID" value={newSession.trainer_id} onChange={e => setNewSession({ ...newSession, trainer_id: e.target.value })} required />
              <input type="date" className="w-full p-3 border rounded-xl" value={newSession.scheduled_date} onChange={e => setNewSession({ ...newSession, scheduled_date: e.target.value })} required />
              <input type="time" className="w-full p-3 border rounded-xl" value={newSession.scheduled_time} onChange={e => setNewSession({ ...newSession, scheduled_time: e.target.value })} required />
              <textarea className="w-full p-3 border rounded-xl" placeholder="Notes" value={newSession.notes} onChange={e => setNewSession({ ...newSession, notes: e.target.value })} />
              <Button type="submit" variant="primary" loading={submitLoading}>Schedule</Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PersonalTraining;
