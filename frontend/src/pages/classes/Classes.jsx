import { useState, useEffect } from "react";
import { Plus, Flame, Music, Smile, Zap
 , Calendar, Clock, MapPin, Search, Edit, Trash2, Eye, X } from "lucide-react";
import { useOrganization } from "../../contexts/OrganizationContext";
import { classService } from "../../lib/services";
import { Button, Card } from "../../components/ui";
const Classes = () => {
  const { currentOrganization, isLoading: orgLoading } = useOrganization();
  const orgId = currentOrganization?.id ?? null;
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [newClass, setNewClass] = useState({
    name: "",
    instructor: "",
    schedule_time: "",
    capacity: 20,
    status: "Active",
    room: "",
    type: "Cardio",
    description: ""
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  useEffect(() => {
    if (!orgLoading) fetchClasses();
  }, [orgLoading, orgId]);
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const rows = await classService.list({ orgId });
      rows.sort((a, b) => (a.schedule_time || "").localeCompare(b.schedule_time || ""));
      setClasses(rows);
    } catch (err) {
      console.error("Error fetching classes:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleAddClass = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await classService.create({ orgId }, newClass);
      setShowAddModal(false);
      setNewClass({
        name: "",
        instructor: "",
        schedule_time: "",
        capacity: 20,
        status: "Active",
        room: "",
        type: "Cardio",
        description: ""
      });
      fetchClasses();
    } catch (err) {
      alert(`Failed to add class: ${err.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };
  const handleUpdateClass = async (e) => {
    e.preventDefault();
    if (!selectedClass) return;
    setSubmitLoading(true);
    try {
      await classService.update(selectedClass.id, {
        name: selectedClass.name,
        instructor: selectedClass.instructor,
        schedule_time: selectedClass.schedule_time,
        capacity: selectedClass.capacity,
        status: selectedClass.status,
        room: selectedClass.room,
        type: selectedClass.type,
        description: selectedClass.description
      });
      setShowEditModal(false);
      fetchClasses();
    } catch (err) {
      alert(`Failed to update class: ${err.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };
  const handleDeleteClass = async (id) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    try {
      await classService.remove(id);
      fetchClasses();
    } catch (err) {
      alert(`Failed to delete class: ${err.message}`);
    }
  };
  const getClassIcon = (type) => {
    switch (type.toLowerCase()) {
      case "yoga":
        return Smile;
      case "zumba":
        return Music;
      case "hiit":
        return Flame;
      default:
        return Zap;
    }
  };
  const filteredClasses = classes.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return <div className="space-y-10 pb-20 animate-in fade-in duration-500 text-slate-900">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Classes</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base">Fitness sessions and schedules.</p>
        </div>
        <Button variant="primary" className="rounded-xl px-6 h-12" icon={Plus} onClick={() => setShowAddModal(true)}>Add Class</Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
    type="text"
    placeholder="Search by class name or instructor..."
    className="w-full pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-xs shadow-sm transition-all text-slate-900"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
        </div>
        <select
    value={selectedFilter}
    onChange={(e) => setSelectedFilter(e.target.value)}
    className="h-11 px-6 bg-white border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-xs text-slate-500 cursor-pointer appearance-none min-w-[160px] shadow-sm"
  >
          <option value="all">All Types</option>
          <option value="Cardio">Cardio</option>
          <option value="Strength">Strength</option>
          <option value="Yoga">Yoga</option>
          <option value="Zumba">Zumba</option>
        </select>
      </div>

      {loading ? <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
          <Calendar className="h-10 w-10 text-slate-300 animate-pulse" />
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest text-slate-900">Loading Schedule...</p>
        </div> : filteredClasses.length === 0 ? <Card className="rounded-3xl border-slate-100 p-20 text-center shadow-xl shadow-slate-200/40 bg-white">
          <Plus className="h-12 w-12 text-slate-100 mx-auto mb-6" />
          <h3 className="text-xl font-black text-slate-900">No Classes Found</h3>
          <p className="text-slate-400 mt-2 font-medium text-sm">No sessions match your search criteria.</p>
        </Card> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredClasses.map((c) => {
    const Icon = getClassIcon(c.type);
    const occupancy = (c.enrolled || 0) / (c.capacity || 1) * 100;
    return <Card key={c.id} className="rounded-3xl border-0 shadow-lg shadow-slate-200/50 hover:shadow-indigo-100 transition-all group overflow-hidden bg-white">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="h-12 w-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
      setSelectedClass(c);
      setShowViewModal(true);
    }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => {
      setSelectedClass({ ...c });
      setShowEditModal(true);
    }} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteClass(c.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100 bg-slate-50`}>
                        {c.type}
                      </span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.status}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{c.name}</h3>
                    <p className="text-xs font-bold text-slate-500">Instructor: {c.instructor}</p>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="h-3 w-3" /> {c.schedule_time}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="h-3 w-3" /> {c.room}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enrolled</span>
                        <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{c.enrolled || 0} / {c.capacity || 0}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
      className={`h-full rounded-full transition-all duration-1000 ${occupancy > 90 ? "bg-rose-500" : "bg-indigo-500"}`}
      style={{ width: `${occupancy}%` }}
    />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>;
  })}
        </div>}

      {
    /* Add Modal */
  }
      {showAddModal && <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 text-slate-900">
          <Card className="w-full max-w-2xl bg-white rounded-3xl border-0 shadow-3xl p-10 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl transition-colors">
              <X className="h-6 w-6 text-slate-400" />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Add Class</h3>
            <p className="text-slate-500 font-medium mb-10 text-sm">Schedule a new training session.</p>

            <form onSubmit={handleAddClass} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class Name</label>
                  <input
    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
    placeholder="Morning Yoga"
    value={newClass.name}
    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
    required
  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instructor</label>
                  <input
    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
    placeholder="Name"
    value={newClass.instructor}
    onChange={(e) => setNewClass({ ...newClass, instructor: e.target.value })}
    required
  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                  <select
    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-900"
    value={newClass.type}
    onChange={(e) => setNewClass({ ...newClass, type: e.target.value })}
  >
                    <option value="Cardio">Cardio</option>
                    <option value="Strength">Strength</option>
                    <option value="Yoga">Yoga</option>
                    <option value="Zumba">Zumba</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Schedule Time</label>
                  <input
    placeholder="Mon, Wed 8:00 AM"
    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
    value={newClass.schedule_time}
    onChange={(e) => setNewClass({ ...newClass, schedule_time: e.target.value })}
    required
  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room</label>
                  <input
    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
    placeholder="Studio A"
    value={newClass.room}
    onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacity</label>
                  <input
    type="number"
    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
    value={newClass.capacity}
    onChange={(e) => setNewClass({ ...newClass, capacity: parseInt(e.target.value) })}
    required
  />
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" loading={submitLoading}>Save Class</Button>
            </form>
          </Card>
        </div>}

      {
    /* Edit Modal */
  }
      {showEditModal && selectedClass && <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 text-slate-900">
          <Card className="w-full max-w-2xl bg-white rounded-3xl border-0 shadow-3xl p-10 relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl transition-colors">
              <X className="h-6 w-6 text-slate-400" />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Edit Class</h3>
            <p className="text-slate-500 font-medium mb-10 text-sm">Update session details.</p>

            <form onSubmit={handleUpdateClass} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class Name</label>
                  <input
    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
    value={selectedClass.name}
    onChange={(e) => setSelectedClass({ ...selectedClass, name: e.target.value })}
    required
  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instructor</label>
                  <input
    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
    value={selectedClass.instructor}
    onChange={(e) => setSelectedClass({ ...selectedClass, instructor: e.target.value })}
    required
  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <select
    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-900"
    value={selectedClass.status}
    onChange={(e) => setSelectedClass({ ...selectedClass, status: e.target.value })}
  >
                    <option value="Active">Active</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Full">Full</option>
                  </select>
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" loading={submitLoading}>Update Class</Button>
            </form>
          </Card>
        </div>}

      {
    /* View Modal */
  }
      {showViewModal && selectedClass && <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 text-slate-900">
          <Card className="w-full max-w-lg bg-white rounded-3xl border-0 shadow-3xl p-10 relative">
            <button onClick={() => setShowViewModal(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl transition-colors">
              <X className="h-6 w-6 text-slate-400" />
            </button>
            <div className="flex items-center gap-6 mb-10">
              <div className="h-16 w-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl font-black">
                {getClassIcon(selectedClass.type)({ className: "h-8 w-8 text-indigo-400" })}
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedClass.name}</h3>
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100 bg-slate-50 mt-2 inline-block">
                  {selectedClass.type}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Instructor</p>
                <p className="font-bold text-sm text-slate-900">{selectedClass.instructor}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Room</p>
                <p className="font-bold text-sm text-slate-900">{selectedClass.room}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
                <p className="font-bold text-xs text-slate-900 leading-relaxed">{selectedClass.description || "No description provided."}</p>
              </div>
            </div>

            <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => setShowViewModal(false)}>Close</Button>
          </Card>
        </div>}
    </div>;
};
var Classes_default = Classes;
export {
  Classes_default as default
};
