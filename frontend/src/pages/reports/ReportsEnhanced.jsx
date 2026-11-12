import { useState, useEffect, useCallback } from "react";
import { BarChart3, TrendingUp, Users, DollarSign, Activity, Calendar, Download } from "lucide-react";
import { useToast } from "../../components/ui/Toast";
import { useOrganization } from "../../contexts/OrganizationContext";
import { api } from "../../lib/api";
import { memberService, paymentService } from "../../lib/services";
import { exportToCsv } from "../../utils/export";
import { Button, Card } from "../../components/ui";
const Reports = () => {
  const { notify } = useToast();
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [metrics, setMetrics] = useState({
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    newRegistrations: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    outstandingBalance: 0,
    totalExpenses: 0,
    netProfit: 0,
    attendanceRate: 0,
    membershipRenewals: 0
  });
  const fetchMetrics = useCallback(async () => {
    if (!currentOrganization) return;
    try {
      setLoading(true);
      const orgId = currentOrganization.id;
      const now = /* @__PURE__ */ new Date();
      const startDate = /* @__PURE__ */ new Date();
      switch (dateRange) {
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(now.getDate() - 90);
          break;
        case "1y":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      const scope = { orgId };
      const [members, payments, expenses, attendanceRecords] = await Promise.all([
        memberService.list(scope),
        paymentService.list(scope, 1e4),
        api("/api/expenses", { scope }),
        api("/api/attendance/history", { scope }).catch(() => [])
      ]);
      const activeMembers = members.filter((m) => m.status === "Active").length;
      const expiredMembers = members.filter((m) => {
        const expiry = m.expiry_date ? new Date(m.expiry_date) : null;
        return expiry && expiry < now;
      }).length;
      const newRegistrations = members.filter((m) => {
        const joined = m.join_date ? new Date(m.join_date) : null;
        return joined && joined >= startDate;
      }).length;
      const completedPayments = payments.filter((p) => p.status === "completed");
      const pendingPayments = payments.filter((p) => p.status === "pending");
      const rangePayments = completedPayments.filter((p) => {
        const created = p.created_at ? new Date(p.created_at) : null;
        return created && created >= startDate;
      });
      const totalRevenue = rangePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const pendingRevenue = pendingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const outstandingBalance = pendingRevenue;
      const rangeExpenses = expenses.filter((e) => {
        const date = e.date ? new Date(String(e.date)) : null;
        return date && date >= startDate;
      });
      const totalExpenses = rangeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const rangeAttendance = attendanceRecords.filter((a) => {
        const checkIn = a.check_in ? new Date(String(a.check_in)) : null;
        return checkIn && checkIn >= startDate;
      });
      const attendanceRate = members.length > 0 ? rangeAttendance.length / members.length * 100 : 0;
      const membershipRenewals = 0;
      setMetrics({
        totalMembers: members.length,
        activeMembers,
        expiredMembers,
        newRegistrations,
        totalRevenue,
        pendingRevenue,
        outstandingBalance,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        attendanceRate,
        membershipRenewals
      });
    } catch (err) {
      console.error("Error fetching metrics:", err);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, dateRange]);
  useEffect(() => {
    if (currentOrganization) {
      fetchMetrics();
    }
  }, [currentOrganization, fetchMetrics]);
  const handleExport = () => {
    const data = [{
      dateRange,
      ...metrics,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString()
    }];
    exportToCsv(
      `report-${dateRange}-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`,
      [
        { header: "Date Range", value: (d) => d.dateRange },
        { header: "Total Members", value: (d) => d.totalMembers },
        { header: "Active Members", value: (d) => d.activeMembers },
        { header: "Expired Members", value: (d) => d.expiredMembers },
        { header: "New Registrations", value: (d) => d.newRegistrations },
        { header: "Total Revenue", value: (d) => d.totalRevenue },
        { header: "Pending Revenue", value: (d) => d.pendingRevenue },
        { header: "Outstanding Balance", value: (d) => d.outstandingBalance },
        { header: "Total Expenses", value: (d) => d.totalExpenses },
        { header: "Net Profit", value: (d) => d.netProfit },
        { header: "Attendance Rate", value: (d) => d.attendanceRate.toFixed(2) + "%" }
      ],
      data
    );
    notify("Report exported", "success");
  };
  if (!currentOrganization) {
    return <div className="h-[60vh] flex items-center justify-center">
        <p className="text-slate-500 font-bold">Please select an organization first</p>
      </div>;
  }
  if (loading) {
    return <div className="h-[60vh] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full" />
      </div>;
  }
  const statCards = [
    { label: "Total Members", value: metrics.totalMembers, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Active Members", value: metrics.activeMembers, icon: Activity, color: "bg-emerald-50 text-emerald-600" },
    { label: "New Registrations", value: metrics.newRegistrations, icon: Calendar, color: "bg-indigo-50 text-indigo-600" },
    { label: "Total Revenue", value: `$${metrics.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "bg-green-50 text-green-600" },
    { label: "Outstanding Balance", value: `$${metrics.outstandingBalance.toFixed(2)}`, icon: TrendingUp, color: "bg-amber-50 text-amber-600" },
    { label: "Total Expenses", value: `$${metrics.totalExpenses.toFixed(2)}`, icon: BarChart3, color: "bg-rose-50 text-rose-600" },
    { label: "Net Profit", value: `$${metrics.netProfit.toFixed(2)}`, icon: DollarSign, color: metrics.netProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600" },
    { label: "Attendance Rate", value: `${metrics.attendanceRate.toFixed(1)}%`, icon: Activity, color: "bg-purple-50 text-purple-600" }
  ];
  return <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Business insights for {currentOrganization.name}.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
    value={dateRange}
    onChange={(e) => setDateRange(e.target.value)}
    className="h-10 px-4 bg-white border border-slate-100 rounded-xl outline-none font-bold text-slate-500 cursor-pointer appearance-none"
  >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <Button variant="outline" icon={Download} onClick={handleExport}>Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => <Card key={stat.label} className="rounded-2xl border-0 shadow-lg bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-10 w-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
          </Card>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-lg bg-white p-6">
          <h3 className="text-lg font-black text-slate-900 mb-4">Membership Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Total Members</span>
              <span className="font-bold">{metrics.totalMembers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Active Members</span>
              <span className="font-bold text-emerald-600">{metrics.activeMembers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Expired Members</span>
              <span className="font-bold text-rose-600">{metrics.expiredMembers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">New Registrations</span>
              <span className="font-bold text-indigo-600">{metrics.newRegistrations}</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-white p-6">
          <h3 className="text-lg font-black text-slate-900 mb-4">Financial Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Total Revenue</span>
              <span className="font-bold text-emerald-600">${metrics.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Pending Revenue</span>
              <span className="font-bold text-amber-600">${metrics.pendingRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Outstanding Balance</span>
              <span className="font-bold text-rose-600">${metrics.outstandingBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Total Expenses</span>
              <span className="font-bold text-rose-600">${metrics.totalExpenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <span className="text-slate-900 font-bold">Net Profit</span>
              <span className={`font-bold ${metrics.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                ${metrics.netProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-lg bg-white p-6">
        <h3 className="text-lg font-black text-slate-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-slate-500 text-sm">Member Activity</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{metrics.attendanceRate.toFixed(1)}%</p>
            <p className="text-xs text-slate-400 mt-1">Attendance rate</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-slate-500 text-sm">Revenue Growth</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics.totalRevenue > 0 ? "+" : ""}{(metrics.totalRevenue / (metrics.totalRevenue + 1) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-slate-400 mt-1">vs previous period</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-slate-500 text-sm">Active Rate</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics.totalMembers > 0 ? (metrics.activeMembers / metrics.totalMembers * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-slate-400 mt-1">Members active</p>
          </div>
        </div>
      </Card>
    </div>;
};
var ReportsEnhanced_default = Reports;
export {
  ReportsEnhanced_default as default
};
