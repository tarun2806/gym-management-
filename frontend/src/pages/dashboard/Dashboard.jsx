import { useState, useEffect } from "react";


import { api } from "../../lib/api";
import { useOrganization } from "../../contexts/OrganizationContext";
import { memberService, classService, equipmentService } from "../../lib/services";
import { expiryStatus } from "../../utils/dates";
import { Users, Calendar, Activity, ArrowRight, Layout, DollarSign, Box, CalendarClock, UserCheck, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui";
const DAY_MS = 24 * 60 * 60 * 1e3;
const Dashboard = () => {
  const { currentOrganization, isLoading: orgLoading } = useOrganization();
  const orgId = currentOrganization?.id ?? null;
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    members: 0,
    classes: 0,
    revenueMonth: "\u20B90",
    equipment: { value: "\u2014", hasData: false, operational: 0, total: 0 }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [checkInsToday, setCheckInsToday] = useState(0);
  const [maintenanceDue, setMaintenanceDue] = useState(0);
  const [currentTime, setCurrentTime] = useState(/* @__PURE__ */ new Date());
  useEffect(() => {
    if (orgLoading) return;
    fetchDashboardData();
    const timer = setInterval(() => setCurrentTime(/* @__PURE__ */ new Date()), 6e4);
    return () => clearInterval(timer);
  }, [orgLoading, orgId]);
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (!orgId) {
        setStatsData({ members: 0, classes: 0, revenueMonth: "\u20B90", equipment: { value: "\u2014", hasData: false, operational: 0, total: 0 } });
        setRecentActivities([]);
        setExpiring([]);
        setTodaysClasses([]);
        setCheckInsToday(0);
        setMaintenanceDue(0);
        return;
      }
      const scope = { orgId };
      const weekAhead = Date.now() + 7 * DAY_MS;
      const [summary, members, classes, equipment] = await Promise.all([
        api("/api/dashboard", { scope }),
        memberService.list(scope),
        classService.list(scope),
        equipmentService.list(scope)
      ]);
      const totalEquip = equipment.length;
      const operationalEquip = equipment.filter((e) => e.status === "operational").length;
      const needsAttention = totalEquip - operationalEquip;
      const eHealth = totalEquip > 0 ? `${Math.round(operationalEquip / totalEquip * 100)}%` : "\u2014";
      setMaintenanceDue(needsAttention);
      setCheckInsToday(summary.attendance_today ?? 0);
      setStatsData({
        members: summary.total_members ?? members.length,
        classes: summary.classes ?? classes.length,
        revenueMonth: `\u20B9${Number(summary.monthly_revenue ?? 0).toLocaleString()}`,
        equipment: { value: eHealth, hasData: totalEquip > 0, operational: operationalEquip, total: totalEquip }
      });
      setTodaysClasses(classes.filter((c) => (c.status || "").toLowerCase() === "active" || !c.status).sort((a, b) => (a.schedule_time || "").localeCompare(b.schedule_time || "")).slice(0, 5).map((c) => ({
        id: c.id,
        name: c.name || "Untitled class",
        instructor: c.instructor || "\u2014",
        schedule_time: c.schedule_time || "",
        room: c.room || "\u2014",
        capacity: Number(c.capacity) || 0,
        enrolled: Number(c.enrolled) || 0,
        status: c.status || ""
      })));
      setExpiring(members.filter((m) => m.status === "Active" && m.expiry_date && new Date(m.expiry_date).getTime() <= weekAhead).map((m) => ({
        id: m.id,
        name: m.name || "Unknown",
        expiry_date: m.expiry_date,
        days_left: Math.max(0, Math.ceil((new Date(m.expiry_date).getTime() - Date.now()) / DAY_MS)),
        status: m.status || ""
      })).filter((m) => expiryStatus(m.expiry_date) === "expiring").sort((a, b) => a.days_left - b.days_left).slice(0, 6));
      setRecentActivities([...members].sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))).slice(0, 5).map((m, i) => ({
        id: i,
        member: m.name || "Unknown",
        time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
        status: m.status || ""
      })));
    } catch (error) {
      console.error("Core sync failure:", error);
    } finally {
      setLoading(false);
    }
  };
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };
  const alertsCount = expiring.length + maintenanceDue;
  const statusLine = loading ? "Loading gym status\u2026" : alertsCount === 0 ? "No pending alerts. Everything is up to date." : `${alertsCount} item${alertsCount > 1 ? "s" : ""} need attention (${expiring.length} expiring membership${expiring.length === 1 ? "" : "s"}, ${maintenanceDue} equipment needing service).`;
  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center">
        <div className="p-8 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-6 shadow-xl" />
          <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Loading Dashboard...</p>
        </div>
      </div>;
  }
  return <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {
    /* Header Section */
  }
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-[10px] mb-3">
            Operational Overview
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none">{getGreeting()}</h1>
          <p className="text-slate-500 mt-4 text-lg font-medium max-w-lg">{statusLine}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-[24px] shadow-lg shadow-slate-100 flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="pr-3">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Today</p>
              <p className="text-xs font-bold text-slate-900">{currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
          </div>
        </div>
      </div>

      {
    /* Stats Grid */
  }
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-0 shadow-lg shadow-slate-200/40 p-6 bg-white group hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-[9px] font-bold bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-widest">All-time</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Members</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{statsData.members}</h3>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg shadow-slate-200/40 p-6 bg-white group hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <Layout className="h-5 w-5" />
            </div>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Classes</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{statsData.classes}</h3>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg shadow-slate-200/40 p-6 bg-white group hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full uppercase tracking-widest">This month</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Revenue</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{statsData.revenueMonth}</h3>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg shadow-slate-200/40 p-6 bg-white group hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
              <Box className="h-5 w-5" />
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${maintenanceDue > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}`}>
              {statsData.equipment.hasData ? `${statsData.equipment.operational}/${statsData.equipment.total} OK` : "No data"}
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Equipment Operational</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{statsData.equipment.value}</h3>
        </Card>
      </div>

      {
    /* Expiring memberships strip */
  }
      {expiring.length > 0 && <Card className="rounded-2xl border-0 shadow-lg shadow-slate-200/40 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CalendarClock className="h-3.5 w-3.5 text-amber-500" /> Expiring in 7 days
            </p>
            <Link to="/members" className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Manage</Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {expiring.map((m) => <div key={m.id} className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs font-bold text-slate-900">{m.name}</p>
                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
                  {m.days_left <= 1 ? "Today" : `${m.days_left} days left`}
                </p>
              </div>)}
          </div>
        </Card>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {
    /* Today: schedule + pulse (operational monitoring, not admin shortcuts) */
  }
        <Card className="lg:col-span-2 rounded-[32px] border-0 shadow-xl shadow-slate-200/40 bg-white overflow-hidden p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Today at a Glance</h3>
              <p className="text-slate-500 text-xs font-medium mt-1">Live operational status.</p>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{checkInsToday} check-ins</span>
            </div>
          </div>

          {todaysClasses.length === 0 ? <div className="py-10 text-center rounded-2xl bg-slate-50/60 border border-slate-100">
              <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No classes scheduled</p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Active class sessions will show up here.</p>
            </div> : <div className="space-y-3">
              {todaysClasses.map((c) => {
    const full = c.capacity > 0 && c.enrolled >= c.capacity;
    return <div key={c.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="w-16 shrink-0 text-center">
                      <p className="text-xs font-black text-slate-900">{c.schedule_time || "\u2014"}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Room {c.room}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                      <p className="text-[10px] font-medium text-slate-400 truncate">Coach: {c.instructor}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${full ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                      {c.enrolled}/{c.capacity || "\u2014"}
                    </span>
                  </div>;
  })}
            </div>}

          {maintenanceDue > 0 && <div className="mt-6 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-[11px] font-bold text-amber-700">
                {maintenanceDue} equipment item{maintenanceDue > 1 ? "s" : ""} not marked operational.
              </p>
              <Link to="/equipment" className="ml-auto text-[9px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1">
                Review <ArrowRight className="h-3 w-3" />
              </Link>
            </div>}
        </Card>

        {
    /* Recent Activity */
  }
        <Card className="rounded-[32px] border-0 shadow-xl shadow-slate-200/40 bg-slate-900 text-white p-8 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-black text-white tracking-tight mb-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" /> Latest Updates
            </h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6 leading-relaxed">Recent member enrollments</p>

            <div className="space-y-5">
              {recentActivities.length === 0 ? <p className="text-[11px] font-medium text-slate-500">No member activity yet.</p> : recentActivities.map((activity) => <div key={activity.id} className="relative pl-5 group cursor-default">
                  <div className={`absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full shadow-lg ${activity.status === "Active" ? "bg-emerald-400" : "bg-slate-500"}`} />
                  <div className="absolute left-[2.5px] top-4 h-full w-[0.5px] bg-white/5" />

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Enrollment</p>
                      <span className="text-[8px] font-bold text-slate-600">{activity.time}</span>
                    </div>
                    <p className="text-xs font-bold text-white truncate">{activity.member}</p>
                  </div>
                </div>)}
            </div>

            <Link to="/members" className="mt-8 group flex items-center justify-center p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5">
              View All <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </Card>
      </div>
    </div>;
};
var Dashboard_default = Dashboard;
export {
  Dashboard_default as default
};
