import { useState, useEffect } from "react";
import { Plus  , Building2, Edit, Trash2, X, MapPin, Users, CheckCircle } from "lucide-react";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import { useOrganization } from "../../contexts/OrganizationContext";
import { api } from "../../lib/api";
import { logAudit } from "../../lib/audit";
import { mapOrg } from "../../contexts/OrganizationContext";
import { Button, Card } from "../../components/ui";
const Organizations = () => {
  const { notify } = useToast();
  const { user, can } = useAuth();
  const { currentOrganization, setCurrentOrganization } = useOrganization();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [newOrg, setNewOrg] = useState({
    name: "",
    slug: "",
    status: "active",
    subscription_tier: "basic",
    max_branches: 1,
    max_members: 100,
    gym_name: "",
    address: "",
    phone: "",
    open_time: "06:00",
    close_time: "22:00",
    capacity: 50
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  useEffect(() => {
    fetchOrganizations();
  }, []);
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const rows = await api("/api/organizations");
      setOrganizations(rows.map(mapOrg));
    } catch (err) {
      console.error("Error fetching organizations:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleAddOrg = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const slug = newOrg.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      await api("/api/organizations", {
        method: "POST",
        body: {
          ...newOrg,
          slug,
          settings: {
            gym_name: newOrg.gym_name,
            address: newOrg.address,
            phone: newOrg.phone,
            open_time: newOrg.open_time,
            close_time: newOrg.close_time,
            capacity: newOrg.capacity
          }
        }
      });
      setShowAddModal(false);
      setNewOrg({
        name: "",
        slug: "",
        status: "active",
        subscription_tier: "basic",
        max_branches: 1,
        max_members: 100,
        gym_name: "",
        address: "",
        phone: "",
        open_time: "06:00",
        close_time: "22:00",
        capacity: 50
      });
      fetchOrganizations();
      notify("Organization created", "success");
    } catch (err) {
      notify(`Failed to create organization: ${err.message}`, "error");
    } finally {
      setSubmitLoading(false);
    }
  };
  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setSubmitLoading(true);
    try {
      await api(`/api/organizations/${selectedOrg.id}`, {
        method: "PUT",
        body: {
          name: selectedOrg.name,
          status: selectedOrg.status,
          subscription_tier: selectedOrg.subscription_tier,
          max_branches: selectedOrg.max_branches,
          max_members: selectedOrg.max_members,
          settings: {
            gym_name: selectedOrg.settings?.gym_name,
            address: selectedOrg.settings?.address,
            phone: selectedOrg.settings?.phone,
            open_time: selectedOrg.settings?.open_time,
            close_time: selectedOrg.settings?.close_time,
            capacity: selectedOrg.settings?.capacity
          }
        }
      });
      setShowEditModal(false);
      fetchOrganizations();
      notify("Organization updated", "success");
    } catch (err) {
      notify(`Failed to update organization: ${err.message}`, "error");
    } finally {
      setSubmitLoading(false);
    }
  };
  const handleDeleteOrg = async (id) => {
    if (!confirm("Are you sure you want to delete this organization? This cannot be undone.")) return;
    try {
      await api(`/api/organizations/${id}`, { method: "DELETE" });
      await logAudit("warning", `Organization deleted: ID ${id}`, user?.username || "admin", "org_delete");
      fetchOrganizations();
      notify("Organization deleted", "success");
    } catch (err) {
      notify(`Failed to delete organization: ${err.message}`, "error");
    }
  };
  const handleSwitchOrg = (org) => {
    setCurrentOrganization(org);
    notify(`Switched to ${org.name}`, "success");
  };
  const filteredOrgs = organizations.filter((o) => {
    if (can("admin")) return true;
    if (can("organizations.manage") && o.owner_id === user?.id) return true;
    return false;
  });
  if (loading) {
    return <div className="h-[60vh] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full" />
      </div>;
  }
  return <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Organizations</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage gym organizations.</p>
        </div>
        {(can("admin") || can("organizations.manage")) && <Button variant="primary" className="rounded-xl bg-slate-900 hover:bg-black px-6 h-10 border-0 shadow-md text-sm" icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Organization
          </Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrgs.map((org) => <Card key={org.id} className={`rounded-2xl border-0 shadow-xl shadow-slate-200/40 bg-white overflow-hidden ${currentOrganization?.id === org.id ? "ring-2 ring-indigo-500" : ""}`}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSwitchOrg(org)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Switch to this organization">
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  {(can("admin") || org.owner_id === user?.id) && <>
                      <button onClick={() => {
    setSelectedOrg(org);
    setShowEditModal(true);
  }} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteOrg(org.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>}
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 tracking-tight">{org.name}</h3>
              <p className="text-slate-500 text-xs font-medium mt-1">{org.settings?.gym_name || org.name}</p>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-xs text-slate-600">
                  <MapPin className="h-3 w-3 mr-2" />
                  {org.settings?.address || "No address"}
                </div>
                <div className="flex items-center text-xs text-slate-600">
                  <Users className="h-3 w-3 mr-2" />
                  {org.subscription_tier} tier
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${org.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {org.status}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {org.max_branches} branches max
                </span>
              </div>
            </div>
          </Card>)}
      </div>

      {showAddModal && <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <Card className="max-w-2xl w-full p-0 rounded-2xl border-0 shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Add Organization</h2>
                  <p className="text-slate-500 mt-1 text-sm">Create a new gym organization.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddOrg} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Organization Name</label>
                    <input
    type="text"
    required
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
    value={newOrg.name}
    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
  />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Gym Name</label>
                    <input
    type="text"
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
    value={newOrg.gym_name}
    onChange={(e) => setNewOrg({ ...newOrg, gym_name: e.target.value })}
  />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Subscription Tier</label>
                    <select
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all appearance-none"
    value={newOrg.subscription_tier}
    onChange={(e) => setNewOrg({ ...newOrg, subscription_tier: e.target.value })}
  >
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Status</label>
                    <select
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all appearance-none"
    value={newOrg.status}
    onChange={(e) => setNewOrg({ ...newOrg, status: e.target.value })}
  >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Max Branches</label>
                    <input
    type="number"
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
    value={newOrg.max_branches}
    onChange={(e) => setNewOrg({ ...newOrg, max_branches: parseInt(e.target.value) })}
  />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Max Members</label>
                    <input
    type="number"
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
    value={newOrg.max_members}
    onChange={(e) => setNewOrg({ ...newOrg, max_members: parseInt(e.target.value) })}
  />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 ml-1">Address</label>
                    <input
    type="text"
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
    value={newOrg.address}
    onChange={(e) => setNewOrg({ ...newOrg, address: e.target.value })}
  />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Phone</label>
                    <input
    type="tel"
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
    value={newOrg.phone}
    onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
  />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Capacity</label>
                    <input
    type="number"
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
    value={newOrg.capacity}
    onChange={(e) => setNewOrg({ ...newOrg, capacity: parseInt(e.target.value) })}
  />
                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t border-slate-50">
                  <Button type="button" variant="outline" className="flex-1 rounded-xl py-3 text-sm h-10" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" className="flex-1 rounded-xl py-3 bg-slate-900 border-0 text-sm h-10" loading={submitLoading}>Create</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>}

      {showEditModal && selectedOrg && <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <Card className="max-w-2xl w-full p-0 rounded-2xl border-0 shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Edit Organization</h2>
                  <p className="text-slate-500 mt-1 text-sm">{selectedOrg.name}</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateOrg} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Organization Name</label>
                    <input
    type="text"
    required
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
    value={selectedOrg.name}
    onChange={(e) => setSelectedOrg({ ...selectedOrg, name: e.target.value })}
  />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Gym Name</label>
                    <input
    type="text"
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
    value={selectedOrg.settings?.gym_name || ""}
    onChange={(e) => setSelectedOrg({ ...selectedOrg, settings: { ...selectedOrg.settings, gym_name: e.target.value } })}
  />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Subscription Tier</label>
                    <select
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all appearance-none"
    value={selectedOrg.subscription_tier}
    onChange={(e) => setSelectedOrg({ ...selectedOrg, subscription_tier: e.target.value })}
  >
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Status</label>
                    <select
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all appearance-none"
    value={selectedOrg.status}
    onChange={(e) => setSelectedOrg({ ...selectedOrg, status: e.target.value })}
  >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Max Branches</label>
                    <input
    type="number"
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
    value={selectedOrg.max_branches}
    onChange={(e) => setSelectedOrg({ ...selectedOrg, max_branches: parseInt(e.target.value) })}
  />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Max Members</label>
                    <input
    type="number"
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
    value={selectedOrg.max_members}
    onChange={(e) => setSelectedOrg({ ...selectedOrg, max_members: parseInt(e.target.value) })}
  />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 ml-1">Address</label>
                    <input
    type="text"
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
    value={selectedOrg.settings?.address || ""}
    onChange={(e) => setSelectedOrg({ ...selectedOrg, settings: { ...selectedOrg.settings, address: e.target.value } })}
  />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Phone</label>
                    <input
    type="tel"
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
    value={selectedOrg.settings?.phone || ""}
    onChange={(e) => setSelectedOrg({ ...selectedOrg, settings: { ...selectedOrg.settings, phone: e.target.value } })}
  />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Capacity</label>
                    <input
    type="number"
    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
    value={selectedOrg.settings?.capacity || 50}
    onChange={(e) => setSelectedOrg({ ...selectedOrg, settings: { ...selectedOrg.settings, capacity: parseInt(e.target.value) } })}
  />
                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t border-slate-50">
                  <Button type="button" variant="outline" className="flex-1 rounded-xl py-3 text-sm h-10" onClick={() => setShowEditModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" className="flex-1 rounded-xl py-3 bg-slate-900 border-0 text-sm h-10" loading={submitLoading}>Save</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>}
    </div>;
};
var Organizations_default = Organizations;
export {
  Organizations_default as default
};
