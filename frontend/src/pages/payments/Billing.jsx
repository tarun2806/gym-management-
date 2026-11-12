import { useState, useEffect, useCallback } from "react";
import { Plus, CheckCircle  , FileText, X } from "lucide-react";
import { useToast } from "../../components/ui/Toast";
import { useOrganization } from "../../contexts/OrganizationContext";
import { api } from "../../lib/api";
import { Button, Card } from "../../components/ui";
const Billing = () => {
  const { notify } = useToast();
  const { currentOrganization } = useOrganization();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    member_id: "",
    items: [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
    notes: "",
    due_date: ""
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const fetchInvoices = useCallback(async () => {
    if (!currentOrganization) return;
    try {
      setLoading(true);
      const rows = await api("/api/invoices", {
        scope: { orgId: currentOrganization.id }
      });
      setInvoices(rows.map((r) => {
        let items = r.items;
        if (typeof items === "string") {
          try {
            items = JSON.parse(items);
          } catch {
            items = [];
          }
        }
        return { id: String(r.id), ...r, items };
      }));
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);
  useEffect(() => {
    if (currentOrganization) {
      fetchInvoices();
    }
  }, [currentOrganization, fetchInvoices]);
  const generateInvoiceNumber = () => {
    const date = /* @__PURE__ */ new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 1e4).toString().padStart(4, "0");
    return `INV-${year}${month}-${random}`;
  };
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!currentOrganization) return;
    setSubmitLoading(true);
    try {
      const subtotal = newInvoice.items.reduce((sum, item) => sum + item.amount, 0);
      const tax = subtotal * 0.1;
      const total = subtotal + tax;
      await api("/api/invoices", {
        method: "POST",
        scope: { orgId: currentOrganization.id },
        body: {
          invoice_number: generateInvoiceNumber(),
          member_id: newInvoice.member_id,
          amount: total,
          status: "draft",
          due_date: newInvoice.due_date,
          issued_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          items: JSON.stringify(newInvoice.items),
          subtotal,
          tax,
          total,
          notes: newInvoice.notes
        }
      });
      setShowInvoiceModal(false);
      setNewInvoice({
        member_id: "",
        items: [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
        notes: "",
        due_date: ""
      });
      fetchInvoices();
      notify("Invoice created", "success");
    } catch (err) {
      notify(`Failed to create invoice: ${err.message}`, "error");
    } finally {
      setSubmitLoading(false);
    }
  };
  const handleMarkPaid = async (invoice) => {
    try {
      await api(`/api/invoices/${invoice.id}/status`, {
        method: "PATCH",
        scope: { orgId: currentOrganization?.id },
        body: { status: "paid" }
      });
      fetchInvoices();
      notify("Invoice marked as paid", "success");
    } catch (err) {
      notify(`Failed to update invoice: ${err.message}`, "error");
    }
  };
  const addItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: "", quantity: 1, unit_price: 0, amount: 0 }]
    });
  };
  const updateItem = (index, field, value) => {
    const items = [...newInvoice.items];
    items[index] = { ...items[index], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      items[index].amount = items[index].quantity * items[index].unit_price;
    }
    setNewInvoice({ ...newInvoice, items });
  };
  const removeItem = (index) => {
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.filter((_, i) => i !== index)
    });
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
  return <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Billing & Invoices</h1>
        <Button variant="primary" icon={Plus} onClick={() => setShowInvoiceModal(true)}>Create Invoice</Button>
      </div>

      <div className="space-y-4">
        {invoices.map((invoice) => <Card key={invoice.id} className="rounded-xl border-0 shadow bg-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="h-8 w-8 text-slate-400" />
              <div>
                <p className="font-bold text-slate-900">{invoice.invoice_number}</p>
                <p className="text-xs text-slate-500">Due: {invoice.due_date}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold">${invoice.total.toFixed(2)}</span>
              <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${invoice.status === "paid" ? "bg-emerald-50 text-emerald-700" : invoice.status === "overdue" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                {invoice.status}
              </span>
              {invoice.status !== "paid" && <Button variant="primary" size="sm" onClick={() => handleMarkPaid(invoice)} icon={CheckCircle}>Mark Paid</Button>}
            </div>
          </Card>)}
      </div>

      {showInvoiceModal && <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full p-6 rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create Invoice</h2>
              <button onClick={() => setShowInvoiceModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <input className="w-full p-3 border rounded-xl" placeholder="Member ID" value={newInvoice.member_id} onChange={(e) => setNewInvoice({ ...newInvoice, member_id: e.target.value })} required />
              <input type="date" className="w-full p-3 border rounded-xl" value={newInvoice.due_date} onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })} required />
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Items</span>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Add Item</Button>
                </div>
                {newInvoice.items.map((item, index) => <div key={index} className="flex gap-2 items-center p-3 bg-slate-50 rounded-xl">
                    <input className="flex-1 p-2 border rounded-lg text-sm" placeholder="Description" value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} />
                    <input type="number" className="w-20 p-2 border rounded-lg text-sm" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))} />
                    <input type="number" className="w-24 p-2 border rounded-lg text-sm" placeholder="Price" value={item.unit_price} onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value))} />
                    <span className="w-20 text-sm font-bold">${item.amount.toFixed(2)}</span>
                    <button type="button" onClick={() => removeItem(index)} className="text-rose-600"><X className="h-4 w-4" /></button>
                  </div>)}
              </div>
              
              <textarea className="w-full p-3 border rounded-xl" placeholder="Notes" value={newInvoice.notes} onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })} />
              <Button type="submit" variant="primary" loading={submitLoading}>Create Invoice</Button>
            </form>
          </Card>
        </div>}
    </div>;
};
var Billing_default = Billing;
export {
  Billing_default as default
};
