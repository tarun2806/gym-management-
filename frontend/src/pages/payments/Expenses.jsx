import { useState, useEffect, useCallback } from "react";
import { Plus, CheckCircle  , Receipt, X } from "lucide-react";
import { useToast } from "../../components/ui/Toast";
import { useOrganization } from "../../contexts/OrganizationContext";
import { api } from "../../lib/api";
import { Button, Card } from "../../components/ui";
const Expenses = () => {
  const { notify } = useToast();
  const { currentOrganization } = useOrganization();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: "Rent",
    description: "",
    amount: 0,
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    payment_method: "Cash",
    vendor: "",
    status: "pending"
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const categories = ["Rent", "Electricity", "Equipment", "Maintenance", "Marketing", "Salaries", "Utilities", "Other"];
  const fetchExpenses = useCallback(async () => {
    if (!currentOrganization) return;
    try {
      setLoading(true);
      const rows = await api("/api/expenses", {
        scope: { orgId: currentOrganization.id }
      });
      setExpenses(rows.map((r) => ({ id: String(r.id), ...r })));
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);
  useEffect(() => {
    if (currentOrganization) {
      fetchExpenses();
    }
  }, [currentOrganization, fetchExpenses]);
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!currentOrganization) return;
    setSubmitLoading(true);
    try {
      await api("/api/expenses", {
        method: "POST",
        scope: { orgId: currentOrganization.id },
        body: { ...newExpense, amount: Number(newExpense.amount) }
      });
      setShowAddModal(false);
      setNewExpense({
        category: "Rent",
        description: "",
        amount: 0,
        date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        payment_method: "Cash",
        vendor: "",
        status: "pending"
      });
      fetchExpenses();
      notify("Expense recorded", "success");
    } catch (err) {
      notify(`Failed to record expense: ${err.message}`, "error");
    } finally {
      setSubmitLoading(false);
    }
  };
  const handleApprove = async (expense) => {
    try {
      await api(`/api/expenses/${expense.id}/status`, {
        method: "PATCH",
        scope: { orgId: currentOrganization?.id },
        body: { status: "approved" }
      });
      fetchExpenses();
      notify("Expense approved", "success");
    } catch (err) {
      notify(`Failed to approve: ${err.message}`, "error");
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
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Expenses</h1>
        <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>Add Expense</Button>
      </div>

      <div className="space-y-4">
        {expenses.map((expense) => <Card key={expense.id} className="rounded-xl border-0 shadow bg-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Receipt className="h-8 w-8 text-slate-400" />
              <div>
                <p className="font-bold text-slate-900">{expense.category}</p>
                <p className="text-xs text-slate-500">{expense.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold">${expense.amount.toFixed(2)}</span>
              <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${expense.status === "approved" ? "bg-emerald-50 text-emerald-700" : expense.status === "rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                {expense.status}
              </span>
              {expense.status === "pending" && <Button variant="primary" size="sm" onClick={() => handleApprove(expense)} icon={CheckCircle}>Approve</Button>}
            </div>
          </Card>)}
      </div>

      {showAddModal && <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full p-6 rounded-2xl bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Expense</h2>
              <button onClick={() => setShowAddModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <select className="w-full p-3 border rounded-xl" value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input className="w-full p-3 border rounded-xl" placeholder="Description" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} required />
              <input type="number" className="w-full p-3 border rounded-xl" placeholder="Amount" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })} required />
              <input type="date" className="w-full p-3 border rounded-xl" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} required />
              <input className="w-full p-3 border rounded-xl" placeholder="Payment Method" value={newExpense.payment_method} onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value })} />
              <input className="w-full p-3 border rounded-xl" placeholder="Vendor" value={newExpense.vendor} onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })} />
              <Button type="submit" variant="primary" loading={submitLoading}>Record Expense</Button>
            </form>
          </Card>
        </div>}
    </div>;
};
var Expenses_default = Expenses;
export {
  Expenses_default as default
};
