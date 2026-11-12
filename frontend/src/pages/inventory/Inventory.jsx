import { useState, useEffect, useCallback } from "react";
import { Plus, Package, ArrowUpDown  , AlertTriangle, X } from "lucide-react";
import { useToast } from "../../components/ui/Toast";
import { useOrganization } from "../../contexts/OrganizationContext";
import { api } from "../../lib/api";
import { Button, Card } from "../../components/ui";
const Inventory = () => {
  const { notify } = useToast();
  const { currentOrganization, currentBranch } = useOrganization();
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const [showProductModal, setShowProductModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Supplements",
    sku: "",
    description: "",
    stock_quantity: 0,
    unit_price: 0,
    supplier: "",
    min_stock: 10,
    status: "active"
  });
  const [newMovement, setNewMovement] = useState({
    product_id: "",
    type: "purchase",
    quantity: 0,
    unit_cost: 0,
    reason: "",
    from_branch_id: "",
    to_branch_id: ""
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const fetchProducts = useCallback(async () => {
    if (!currentOrganization) return;
    try {
      setLoading(true);
      const rows = await api("/api/products", {
        scope: { orgId: currentOrganization.id }
      });
      setProducts(rows.map((r) => ({ id: String(r.id), ...r })));
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);
  const fetchMovements = useCallback(async () => {
    if (!currentOrganization) return;
    try {
      const rows = await api("/api/stock-movements", {
        scope: { orgId: currentOrganization.id }
      });
      setMovements(rows.map((r) => ({ id: String(r.id), ...r })));
    } catch (err) {
      console.error("Error fetching movements:", err);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);
  useEffect(() => {
    if (currentOrganization) {
      fetchProducts();
      fetchMovements();
    }
  }, [currentOrganization, fetchProducts, fetchMovements]);
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!currentOrganization) return;
    setSubmitLoading(true);
    try {
      await api("/api/products", {
        method: "POST",
        scope: { orgId: currentOrganization.id },
        body: {
          ...newProduct,
          stock_quantity: Number(newProduct.stock_quantity),
          unit_price: Number(newProduct.unit_price),
          min_stock: Number(newProduct.min_stock)
        }
      });
      setShowProductModal(false);
      setNewProduct({
        name: "",
        category: "Supplements",
        sku: "",
        description: "",
        stock_quantity: 0,
        unit_price: 0,
        supplier: "",
        min_stock: 10,
        status: "active"
      });
      fetchProducts();
      notify("Product added", "success");
    } catch (err) {
      notify(`Failed to add product: ${err.message}`, "error");
    } finally {
      setSubmitLoading(false);
    }
  };
  const handleAddMovement = async (e) => {
    e.preventDefault();
    if (!currentOrganization) return;
    setSubmitLoading(true);
    try {
      const movementType = ["sale", "adjustment"].includes(newMovement.type) ? "out" : "in";
      await api(`/api/products/${newMovement.product_id}/stock`, {
        method: "POST",
        scope: { orgId: currentOrganization.id, branchId: currentBranch?.id },
        body: {
          type: movementType,
          quantity: Number(newMovement.quantity),
          unit_cost: Number(newMovement.unit_cost),
          reason: newMovement.reason,
          branch_id: newMovement.from_branch_id || newMovement.to_branch_id || void 0
        }
      });
      setShowMovementModal(false);
      setNewMovement({
        product_id: "",
        type: "purchase",
        quantity: 0,
        unit_cost: 0,
        reason: "",
        from_branch_id: "",
        to_branch_id: ""
      });
      fetchProducts();
      fetchMovements();
      notify("Stock movement recorded", "success");
    } catch (err) {
      notify(`Failed to record movement: ${err.message}`, "error");
    } finally {
      setSubmitLoading(false);
    }
  };
  const lowStockProducts = products.filter((p) => p.stock_quantity <= p.min_stock);
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
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inventory</h1>
        <div className="flex gap-2">
          <Button variant={activeTab === "products" ? "primary" : "outline"} onClick={() => setActiveTab("products")} icon={Package}>Products</Button>
          <Button variant={activeTab === "movements" ? "primary" : "outline"} onClick={() => setActiveTab("movements")} icon={ArrowUpDown}>Movements</Button>
          {activeTab === "products" && <Button variant="primary" icon={Plus} onClick={() => setShowProductModal(true)}>Add Product</Button>}
          {activeTab === "movements" && <Button variant="primary" icon={Plus} onClick={() => setShowMovementModal(true)}>Record Movement</Button>}
        </div>
      </div>

      {lowStockProducts.length > 0 && <Card className="rounded-xl border-0 shadow bg-amber-50 p-4 flex items-center gap-4">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
          <p className="font-bold text-amber-900">{lowStockProducts.length} products are low on stock</p>
        </Card>}

      {activeTab === "products" ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => <Card key={product.id} className="rounded-2xl border-0 shadow-xl bg-white p-6">
              <div className="flex justify-between items-start mb-4">
                <Package className="h-10 w-10 text-slate-900" />
                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${product.stock_quantity <= product.min_stock ? "bg-rose-50 text-rose-700" : product.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {product.stock_quantity <= product.min_stock ? "Low Stock" : product.status}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900">{product.name}</h3>
              <p className="text-slate-500 text-sm mt-1">{product.category}</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">SKU:</span>
                  <span className="font-bold">{product.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stock:</span>
                  <span className="font-bold">{product.stock_quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Price:</span>
                  <span className="font-bold">${product.unit_price.toFixed(2)}</span>
                </div>
              </div>
            </Card>)}
        </div> : <div className="space-y-4">
          {movements.map((movement) => <Card key={movement.id} className="rounded-xl border-0 shadow bg-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ArrowUpDown className="h-8 w-8 text-slate-400" />
                <div>
                  <p className="font-bold text-slate-900">{movement.type}</p>
                  <p className="text-xs text-slate-500">Qty: {movement.quantity} • {movement.reason || "No reason"}</p>
                </div>
              </div>
              <span className="text-sm text-slate-500">{new Date(movement.date).toLocaleDateString()}</span>
            </Card>)}
        </div>}

      {showProductModal && <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full p-6 rounded-2xl bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Product</h2>
              <button onClick={() => setShowProductModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input className="w-full p-3 border rounded-xl" placeholder="Name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} required />
              <input className="w-full p-3 border rounded-xl" placeholder="Category" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} />
              <input className="w-full p-3 border rounded-xl" placeholder="SKU" value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} />
              <textarea className="w-full p-3 border rounded-xl" placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" className="w-full p-3 border rounded-xl" placeholder="Stock Quantity" value={newProduct.stock_quantity} onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: parseInt(e.target.value) })} required />
                <input type="number" className="w-full p-3 border rounded-xl" placeholder="Unit Price" value={newProduct.unit_price} onChange={(e) => setNewProduct({ ...newProduct, unit_price: parseFloat(e.target.value) })} required />
                <input type="number" className="w-full p-3 border rounded-xl" placeholder="Min Stock" value={newProduct.min_stock} onChange={(e) => setNewProduct({ ...newProduct, min_stock: parseInt(e.target.value) })} />
              </div>
              <input className="w-full p-3 border rounded-xl" placeholder="Supplier" value={newProduct.supplier} onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })} />
              <Button type="submit" variant="primary" loading={submitLoading}>Add Product</Button>
            </form>
          </Card>
        </div>}

      {showMovementModal && <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full p-6 rounded-2xl bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Record Stock Movement</h2>
              <button onClick={() => setShowMovementModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddMovement} className="space-y-4">
              <select className="w-full p-3 border rounded-xl" value={newMovement.product_id} onChange={(e) => setNewMovement({ ...newMovement, product_id: e.target.value })} required>
                <option value="">Select Product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select className="w-full p-3 border rounded-xl" value={newMovement.type} onChange={(e) => setNewMovement({ ...newMovement, type: e.target.value })}>
                <option value="purchase">Purchase</option>
                <option value="sale">Sale</option>
                <option value="transfer">Transfer</option>
                <option value="adjustment">Adjustment</option>
                <option value="return">Return</option>
              </select>
              <input type="number" className="w-full p-3 border rounded-xl" placeholder="Quantity" value={newMovement.quantity} onChange={(e) => setNewMovement({ ...newMovement, quantity: parseInt(e.target.value) })} required />
              <input type="number" className="w-full p-3 border rounded-xl" placeholder="Unit Cost" value={newMovement.unit_cost} onChange={(e) => setNewMovement({ ...newMovement, unit_cost: parseFloat(e.target.value) })} />
              <input className="w-full p-3 border rounded-xl" placeholder="Reason" value={newMovement.reason} onChange={(e) => setNewMovement({ ...newMovement, reason: e.target.value })} />
              <Button type="submit" variant="primary" loading={submitLoading}>Record Movement</Button>
            </form>
          </Card>
        </div>}
    </div>;
};
var Inventory_default = Inventory;
export {
  Inventory_default as default
};
