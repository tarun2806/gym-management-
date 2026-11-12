import { useState, useEffect, useCallback } from "react";
import { Plus, DollarSign, CheckCircle  , X, Briefcase } from "lucide-react";
import { useToast } from "../../components/ui/Toast";
import { useOrganization } from "../../contexts/OrganizationContext";
import { api } from "../../lib/api";
import { Button, Card } from "../../components/ui";
const Payroll = () => {
  const { notify } = useToast();
  const { currentOrganization } = useOrganization();
  const [payrollEntries, setPayrollEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPayroll, setNewPayroll] = useState({
    employee_id: "",
    employee_name: "",
    employee_type: "staff",
    period_start: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    period_end: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    base_salary: 0,
    commission: 0,
    bonuses: 0,
    deductions: 0
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const fetchPayroll = useCallback(async () => {
    if (!currentOrganization) return;
    try {
      setLoading(true);
      const rows = await api("/api/payroll", {
        scope: { orgId: currentOrganization.id }
      });
      setPayrollEntries(rows.map((r) => ({ id: String(r.id), ...r })));
    } catch (err) {
      console.error("Error fetching payroll:", err);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);
  useEffect(() => {
    if (currentOrganization) {
      fetchPayroll();
    }
  }, [currentOrganization, fetchPayroll]);
  const handleAddPayroll = async (e) => {
    e.preventDefault();
    if (!currentOrganization) return;
    setSubmitLoading(true);
    try {
      await api("/api/payroll", {
        method: "POST",
        scope: { orgId: currentOrganization.id },
        body: {
          ...newPayroll,
          base_salary: Number(newPayroll.base_salary),
          commission: Number(newPayroll.commission),
          bonuses: Number(newPayroll.bonuses),
          deductions: Number(newPayroll.deductions)
        }
      });
      setShowAddModal(false);
      setNewPayroll({
        employee_id: "",
        employee_name: "",
        employee_type: "staff",
        period_start: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        period_end: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        base_salary: 0,
        commission: 0,
        bonuses: 0,
        deductions: 0
      });
      fetchPayroll();
      notify("Payroll entry created", "success");
    } catch (err) {
      notify(`Failed to create payroll: ${err.message}`, "error");
    } finally {
      setSubmitLoading(false);
    }
  };
  const handleProcess = async (entry) => {
    try {
      await api(`/api/payroll/${entry.id}/status`, {
        method: "PATCH",
        scope: { orgId: currentOrganization?.id },
        body: { status: "processed" }
      });
      fetchPayroll();
      notify("Payroll processed", "success");
    } catch (err) {
      notify(`Failed to process: ${err.message}`, "error");
    }
  };
  const handleMarkPaid = async (entry) => {
    try {
      await api(`/api/payroll/${entry.id}/status`, {
        method: "PATCH",
        scope: { orgId: currentOrganization?.id },
        body: { status: "paid" }
      });
      fetchPayroll();
      notify("Payroll marked as paid", "success");
    } catch (err) {
      notify(`Failed to mark paid: ${err.message}`, "error");
    }
  };
  if (loading) {
    return <div className="h-[60vh] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full" />
      </div>;
  }
  if (!currentOrganization) {
    return <div className="h-[60vh] flex items-center justify-center">
        <p className="text-slate-500 font-bold">Please select an organization first</p>
      </div>;
  }
  return <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payroll</h1>
        <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>Add Payroll Entry</Button>
      </div>

      <div className="space-y-4">
        {payrollEntries.map((entry) => <Card key={entry.id} className="rounded-xl border-0 shadow bg-white p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Briefcase className="h-8 w-8 text-slate-400" />
                <div>
                  <p className="font-bold text-slate-900">{entry.employee_name}</p>
                  <p className="text-xs text-slate-500">{entry.employee_type} • {entry.period_start} to {entry.period_end}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${entry.status === "paid" ? "bg-emerald-50 text-emerald-700" : entry.status === "processed" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                {entry.status}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Base Salary</p>
                <p className="font-bold">${entry.base_salary.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400">Commission</p>
                <p className="font-bold">${entry.commission.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400">Deductions</p>
                <p className="font-bold text-rose-600">-${entry.deductions.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400">Net Pay</p>
                <p className="font-bold text-emerald-600">${entry.net_pay.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {entry.status === "draft" && <Button variant="primary" size="sm" onClick={() => handleProcess(entry)} icon={CheckCircle}>Process</Button>}
              {entry.status === "processed" && <Button variant="primary" size="sm" onClick={() => handleMarkPaid(entry)} icon={DollarSign}>Mark Paid</Button>}
            </div>
          </Card>)}
      </div>

      {showAddModal && <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full p-6 rounded-2xl bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Payroll Entry</h2>
              <button onClick={() => setShowAddModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddPayroll} className="space-y-4">
              <input className="w-full p-3 border rounded-xl" placeholder="Employee ID" value={newPayroll.employee_id} onChange={(e) => setNewPayroll({ ...newPayroll, employee_id: e.target.value })} required />
              <input className="w-full p-3 border rounded-xl" placeholder="Employee Name" value={newPayroll.employee_name} onChange={(e) => setNewPayroll({ ...newPayroll, employee_name: e.target.value })} required />
              <select className="w-full p-3 border rounded-xl" value={newPayroll.employee_type} onChange={(e) => setNewPayroll({ ...newPayroll, employee_type: e.target.value })}>
                <option value="staff">Staff</option>
                <option value="trainer">Trainer</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500">Period Start</label>
                  <input type="date" className="w-full p-3 border rounded-xl" value={newPayroll.period_start} onChange={(e) => setNewPayroll({ ...newPayroll, period_start: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Period End</label>
                  <input type="date" className="w-full p-3 border rounded-xl" value={newPayroll.period_end} onChange={(e) => setNewPayroll({ ...newPayroll, period_end: e.target.value })} required />
                </div>
              </div>
              <input type="number" className="w-full p-3 border rounded-xl" placeholder="Base Salary" value={newPayroll.base_salary} onChange={(e) => setNewPayroll({ ...newPayroll, base_salary: parseFloat(e.target.value) })} required />
              <input type="number" className="w-full p-3 border rounded-xl" placeholder="Commission" value={newPayroll.commission} onChange={(e) => setNewPayroll({ ...newPayroll, commission: parseFloat(e.target.value) })} />
              <input type="number" className="w-full p-3 border rounded-xl" placeholder="Bonuses" value={newPayroll.bonuses} onChange={(e) => setNewPayroll({ ...newPayroll, bonuses: parseFloat(e.target.value) })} />
              <input type="number" className="w-full p-3 border rounded-xl" placeholder="Deductions" value={newPayroll.deductions} onChange={(e) => setNewPayroll({ ...newPayroll, deductions: parseFloat(e.target.value) })} />
              <Button type="submit" variant="primary" loading={submitLoading}>Create Entry</Button>
            </form>
          </Card>
        </div>}
    </div>;
};
var Payroll_default = Payroll;
export {
  Payroll_default as default
};
