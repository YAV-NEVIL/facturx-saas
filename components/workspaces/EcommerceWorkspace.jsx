"use client";

import React, { useMemo, useState } from "react";
import {
  ShoppingBag,
  Package,
  Truck,
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Edit2,
  FileText,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  X,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { formatAmount, getCurrencySymbol } from "@/lib/mock-data";

const ORDER_STATUS_META = {
  nouvelle: {
    label: "Nouvelle",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  confirmee: {
    label: "Confirmée",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  en_preparation: {
    label: "En préparation",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
  },
  expediee: {
    label: "En livraison",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
  },
  livree: {
    label: "Livrée",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  annulee: {
    label: "Annulée",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export default function EcommerceWorkspace({
  activeSection = "overview", // "overview" | "products" | "orders" | "billing"
  onChangeSection,
  products = [],
  orders = [],
  invoices = [],
  clients = [],
  companyInfo = {},
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onCreateOrder,
  onUpdateOrderStatus,
  onToggleOrderPayment,
  onGenerateInvoiceFromOrder,
  onOpenInvoice,
  onToast,
}) {
  const currency = companyInfo?.defaultCurrency || companyInfo?.currencySymbol || "FC";
  const currSym = getCurrencySymbol(currency);

  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");

  // Modales Produit & Commande
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    category: "Général",
    price: "",
    stock: "10",
    description: "",
  });

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "+243 ",
    deliveryAddress: "",
    deliveryZone: "Centre-ville",
    driverName: "",
    deliveryFee: "0",
    paymentMethod: "Cash à la livraison",
    notes: "",
  });
  const [orderCart, setOrderCart] = useState([]);
  const [selectedCartProductId, setSelectedCartProductId] = useState("");
  const [selectedCartQty, setSelectedCartQty] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoicingOrderId, setInvoicingOrderId] = useState(null);

  const metrics = useMemo(() => {
    const activeOrders = orders.filter((o) => o.orderStatus !== "annulee");
    const totalRevenue = activeOrders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
    const deliveredCount = activeOrders.filter((o) => o.orderStatus === "livree").length;
    const unbilledCount = activeOrders.filter((o) => !o.invoiceId).length;
    const lowStockCount = products.filter((p) => Number(p.stock || 0) <= 5).length;
    const avgBasket = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;
    return {
      totalOrders: orders.length,
      totalRevenue,
      deliveredCount,
      unbilledCount,
      lowStockCount,
      avgBasket,
    };
  }, [orders, products]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const effectiveOrderFilter = activeSection === "billing" ? "unbilled" : orderFilter;

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      const matchQuery =
        !q ||
        (o.id || "").toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.customerPhone || "").toLowerCase().includes(q) ||
        (o.deliveryZone || "").toLowerCase().includes(q);
      const matchStatus =
        effectiveOrderFilter === "all"
          ? true
          : effectiveOrderFilter === "unbilled"
          ? !o.invoiceId && o.orderStatus !== "annulee"
          : o.orderStatus === effectiveOrderFilter;
      return matchQuery && matchStatus;
    });
  }, [orders, orderSearch, effectiveOrderFilter]);

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: "Général",
      price: "",
      stock: "10",
      description: "",
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || "",
      sku: prod.sku || "",
      category: prod.category || "Général",
      price: String(prod.price ?? ""),
      stock: String(prod.stock ?? "0"),
      description: prod.description || "",
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, {
          name: productForm.name.trim(),
          sku: productForm.sku.trim(),
          category: productForm.category.trim() || "Général",
          price: Number(productForm.price || 0),
          stock: Number(productForm.stock || 0),
          description: productForm.description.trim(),
        });
        if (onToast) onToast("Produit mis à jour dans le catalogue.", "success");
      } else {
        await onCreateProduct({
          name: productForm.name.trim(),
          sku: productForm.sku.trim(),
          category: productForm.category.trim() || "Général",
          price: Number(productForm.price || 0),
          stock: Number(productForm.stock || 0),
          description: productForm.description.trim(),
          isActive: true,
        });
        if (onToast) onToast("Produit ajouté au catalogue E-Commerce !", "success");
      }
      setIsProductModalOpen(false);
    } catch (err) {
      if (onToast) onToast(err.message || "Erreur lors de l'enregistrement du produit.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddProductToCart = () => {
    const prod = products.find((p) => p.id === selectedCartProductId);
    if (!prod) return;
    const availStock = Number(prod.stock || 0);
    if (availStock <= 0) {
      if (onToast) onToast(`Rupture de stock pour "${prod.name}". Réapprovisionnez d'abord le catalogue.`, "error");
      return;
    }
    const qty = Math.max(1, Number(selectedCartQty || 1));
    const existingItem = orderCart.find((i) => i.productId === prod.id);
    const nextQtyTotal = (existingItem ? existingItem.quantity : 0) + qty;
    if (nextQtyTotal > availStock) {
      if (onToast) {
        onToast(
          `Stock insuffisant pour "${prod.name}" (disponible : ${availStock}, demandé : ${nextQtyTotal}).`,
          "error"
        );
      }
      return;
    }
    setOrderCart((prev) => {
      const existing = prev.find((i) => i.productId === prod.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === prod.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          description: prod.name,
          quantity: qty,
          unitPrice: Number(prod.price || 0),
        },
      ];
    });
    setSelectedCartQty("1");
  };

  const cartSubtotal = orderCart.reduce(
    (acc, item) => acc + Number(item.quantity || 1) * Number(item.unitPrice || 0),
    0
  );
  const cartTotal = cartSubtotal + Number(orderForm.deliveryFee || 0);

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    if (!orderForm.customerName.trim() || orderCart.length === 0) {
      if (onToast) onToast("Ajoutez un client et au moins un produit au panier.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const newOrder = {
        id: `CMD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, "0")}`,
        customerName: orderForm.customerName.trim(),
        customerEmail: orderForm.customerEmail.trim(),
        customerPhone: orderForm.customerPhone.trim(),
        deliveryAddress: orderForm.deliveryAddress.trim(),
        deliveryZone: orderForm.deliveryZone.trim() || "Standard",
        driverName: orderForm.driverName.trim(),
        items: orderCart,
        subtotal: cartSubtotal,
        deliveryFee: Number(orderForm.deliveryFee || 0),
        totalAmount: cartTotal,
        paymentMethod: orderForm.paymentMethod,
        paymentStatus: "en_attente",
        orderStatus: "nouvelle",
        notes: orderForm.notes.trim(),
      };
      await onCreateOrder(newOrder);
      setIsOrderModalOpen(false);
      setOrderCart([]);
      setOrderForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "+243 ",
        deliveryAddress: "",
        deliveryZone: "Centre-ville",
        driverName: "",
        deliveryFee: "0",
        paymentMethod: "Cash à la livraison",
        notes: "",
      });
      if (onToast) onToast(`Commande ${newOrder.id} enregistrée !`, "success");
    } catch (err) {
      if (onToast) onToast(err.message || "Erreur lors de la création de la commande.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvoiceOrder = async (order) => {
    if (!onGenerateInvoiceFromOrder) return;
    setInvoicingOrderId(order.id);
    try {
      await onGenerateInvoiceFromOrder(order);
    } finally {
      setInvoicingOrderId(null);
    }
  };

  const sectionTabs = [
    { id: "overview", label: "Tableau E-Commerce", icon: ShoppingBag },
    { id: "products", label: `Catalogue (${products.length})`, icon: Package },
    { id: "orders", label: `Commandes & Livraisons (${orders.length})`, icon: Truck },
    { id: "billing", label: `Gestion de Facturation (${metrics.unbilledCount})`, icon: Receipt },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* En-tête E-Commerce */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Workspace E-Commerce & Vente en Ligne</span>
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Pilotage Boutique, Commandes &amp; Facturation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Catalogue produits, suivi des livraisons et conversion en facture normalisée DGI à la fin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={openNewProductModal}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Nouveau Produit</span>
          </button>
          <button
            type="button"
            onClick={() => setIsOrderModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Commande</span>
          </button>
        </div>
      </div>

      {/* Sous-navigation E-Commerce (Mobile-First scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {sectionTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeSection && onChangeSection(tab.id)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                active
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* KPIs E-Commerce */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Chiffre d&apos;Affaires Commandes
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {formatAmount(metrics.totalRevenue, currSym)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Panier moyen : {formatAmount(metrics.avgBasket, currSym)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Commandes &amp; Livraisons
          </p>
          <p className="text-2xl font-extrabold text-indigo-700 mt-1">{metrics.totalOrders}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            {metrics.deliveredCount} livrée(s) avec succès
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Produits &amp; Stock
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{products.length}</p>
          <p className="text-xs text-amber-600 font-semibold mt-1">
            {metrics.lowStockCount} alerte(s) stock faible (≤ 5)
          </p>
        </div>

        <div
          onClick={() => onChangeSection && onChangeSection("billing")}
          className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5 cursor-pointer hover:border-blue-400 transition-colors"
        >
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            À Facturer (Fin de cycle)
          </p>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">{metrics.unbilledCount}</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>Convertir en facture DGI</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>
      </div>

      {/* VUE OVERVIEW : Chaîne complète se terminant par Gestion de Facturation */}
      {activeSection === "overview" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-extrabold text-slate-900 mb-3">
              Cycle E-Commerce FacturX (de la mise en catalogue jusqu&apos;à la Facturation DGI)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { step: "1. Catalogue", desc: `${products.length} produit(s) géré(s)`, tab: "products" },
                { step: "2. Commande", desc: "Panier, client & adresse", tab: "orders" },
                { step: "3. Livraison", desc: "Coursier, zone & suivi", tab: "orders" },
                {
                  step: "4. Gestion de Facturation",
                  desc: "Facture normalisée DGI & Reçu PDF",
                  tab: "billing",
                },
              ].map((item) => (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => onChangeSection && onChangeSection(item.tab)}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 text-left transition-all cursor-pointer"
                >
                  <p className="text-xs font-extrabold text-blue-700">{item.step}</p>
                  <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Dernières commandes */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Commandes Récentes</h2>
              <button
                type="button"
                onClick={() => onChangeSection && onChangeSection("orders")}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Tout voir →
              </button>
            </div>
            {orders.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                Aucune commande enregistrée. Créez d&apos;abord un produit puis passez votre première commande.
              </div>
            ) : (
              <div className="space-y-2.5">
                {orders.slice(0, 5).map((ord) => {
                  const st = ORDER_STATUS_META[ord.orderStatus] || ORDER_STATUS_META.nouvelle;
                  return (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-extrabold text-slate-900">
                            {ord.id}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${st.badge}`}>
                            {st.label}
                          </span>
                          {ord.invoiceId && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Facturée : {ord.invoiceId}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          <strong>{ord.customerName}</strong> • {ord.deliveryZone} • {ord.paymentMethod}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-sm font-extrabold text-slate-900">
                          {formatAmount(ord.totalAmount, currSym)}
                        </span>
                        {!ord.invoiceId && ord.orderStatus !== "annulee" && (
                          <button
                            type="button"
                            onClick={() => handleInvoiceOrder(ord)}
                            disabled={invoicingOrderId === ord.id}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                          >
                            {invoicingOrderId === ord.id ? "..." : "Facturer"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VUE CATALOGUE PRODUITS */}
      {activeSection === "products" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Rechercher un produit, SKU, catégorie..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
              />
            </div>
            <button
              type="button"
              onClick={openNewProductModal}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un produit</span>
            </button>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Aucun produit dans votre catalogue E-Commerce. Cliquez sur « Ajouter un produit » pour commencer.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {prod.category || "Général"}
                        </span>
                        <h3 className="text-sm font-extrabold text-slate-900 mt-1.5">{prod.name}</h3>
                        {prod.sku && (
                          <p className="text-[11px] font-mono text-slate-400">SKU : {prod.sku}</p>
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          prod.stock <= 5
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        Stock : {prod.stock}
                      </span>
                    </div>
                    {prod.description && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{prod.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/70">
                    <span className="text-base font-extrabold text-blue-700">
                      {formatAmount(prod.price, currSym)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditProductModal(prod)}
                        className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct && onDeleteProduct(prod.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VUE COMMANDES & LIVRAISONS OU GESTION DE FACTURATION */}
      {(activeSection === "orders" || activeSection === "billing") && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          {activeSection === "billing" && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-extrabold">
                  Gestion de Facturation E-Commerce (DGI RDC / OHADA)
                </p>
                <p className="text-blue-800 mt-0.5">
                  Convertissez vos commandes en factures normalisées avec Code DEF, QR Code, PDF et envoi email Brevo au client.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-full bg-white border border-blue-200 font-bold text-blue-700">
                  {metrics.unbilledCount} commande(s) à facturer
                </span>
                <button
                  type="button"
                  onClick={() => onChangeSection && onChangeSection("invoices")}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Registre Factures ({invoices.length})</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Rechercher par N° commande, client, téléphone, zone..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
              />
            </div>
            {activeSection !== "billing" && (
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="all">Toutes les commandes</option>
                <option value="unbilled">Non encore facturées</option>
                {Object.entries(ORDER_STATUS_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              {activeSection === "billing"
                ? "Toutes vos commandes actives ont déjà été facturées. Consultez le Registre Factures pour voir les documents émis."
                : "Aucune commande trouvée pour ce filtre."}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((ord) => {
                const st = ORDER_STATUS_META[ord.orderStatus] || ORDER_STATUS_META.nouvelle;
                const linkedInvoice = ord.invoiceId
                  ? invoices.find((inv) => inv.id === ord.invoiceId)
                  : null;
                const isPaid = ord.paymentStatus === "paye";
                return (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-extrabold text-slate-900">
                            {ord.id}
                          </span>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${st.badge}`}>
                            {st.label}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              isPaid
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            {isPaid ? "Payée" : "Paiement en attente"}
                          </span>
                          {ord.invoiceId && (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Facture : {ord.invoiceId}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          <strong>{ord.customerName}</strong>
                          {ord.customerPhone ? ` • ${ord.customerPhone}` : ""}
                          {ord.deliveryAddress ? ` • ${ord.deliveryAddress}` : ""}
                        </p>
                        {Array.isArray(ord.items) && ord.items.length > 0 && (
                          <p className="text-[11px] text-slate-500 mt-1">
                            Articles :{" "}
                            {ord.items
                              .map((it) => `${it.quantity}× ${it.description}`)
                              .join(", ")}
                          </p>
                        )}
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-base font-extrabold text-slate-900">
                          {formatAmount(ord.totalAmount, currSym)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {ord.paymentMethod} • Zone : {ord.deliveryZone}
                          {ord.driverName ? ` • Livreur : ${ord.driverName}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/70">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={ord.orderStatus}
                          onChange={(e) =>
                            onUpdateOrderStatus && onUpdateOrderStatus(ord.id, e.target.value)
                          }
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700"
                        >
                          {Object.entries(ORDER_STATUS_META).map(([k, v]) => (
                            <option key={k} value={k}>
                              Statut : {v.label}
                            </option>
                          ))}
                        </select>

                        {onToggleOrderPayment && ord.orderStatus !== "annulee" && (
                          <button
                            type="button"
                            onClick={() => onToggleOrderPayment(ord.id)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                              isPaid
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-amber-50"
                            }`}
                          >
                            {isPaid ? "✓ Encaissée" : "Marquer Payée"}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {linkedInvoice ? (
                          <button
                            type="button"
                            onClick={() => onOpenInvoice && onOpenInvoice(linkedInvoice)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Ouvrir Facture / PDF / Email</span>
                          </button>
                        ) : (
                          ord.orderStatus !== "annulee" && (
                            <button
                              type="button"
                              onClick={() => handleInvoiceOrder(ord)}
                              disabled={invoicingOrderId === ord.id}
                              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>
                                {invoicingOrderId === ord.id
                                  ? "Génération..."
                                  : "Générer Facture Normalisée"}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODALE PRODUIT (Mobile-First) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[92dvh] flex flex-col border border-slate-100 shadow-2xl overflow-hidden">
            <div className="shrink-0 px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-extrabold">
                {editingProduct ? "Modifier le Produit" : "Ajouter un Produit E-Commerce"}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom du produit *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Ex: Sneakers Air Max, Pack Beauté..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">SKU / Référence</label>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Catégorie</label>
                    <input
                      type="text"
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Prix unitaire ({currSym}) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Stock disponible *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({ ...productForm, description: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>
              <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Enregistrement..." : "Enregistrer le Produit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE NOUVELLE COMMANDE (Mobile-First) */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92dvh] flex flex-col border border-slate-100 shadow-2xl overflow-hidden">
            <div className="shrink-0 px-5 py-4 bg-blue-700 text-white flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-extrabold">Nouvelle Commande Client</h3>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1.5 rounded-lg text-blue-100 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOrderSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-3.5 text-xs">
                {clients.length > 0 && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Client existant (optionnel — remplit automatiquement)
                    </label>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const chosen = clients.find((c) => c.id === e.target.value);
                        if (chosen) {
                          setOrderForm((prev) => ({
                            ...prev,
                            customerName: chosen.name || prev.customerName,
                            customerEmail: chosen.email || prev.customerEmail,
                            customerPhone: chosen.phone || prev.customerPhone,
                            deliveryAddress: chosen.address || prev.deliveryAddress,
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700"
                    >
                      <option value="">-- Nouveau client ou choisir dans le CRM --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nom du client *</label>
                    <input
                      type="text"
                      required
                      value={orderForm.customerName}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, customerName: e.target.value })
                      }
                      placeholder="Ex: Sarah Kabila"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Téléphone / WhatsApp</label>
                    <input
                      type="tel"
                      value={orderForm.customerPhone}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, customerPhone: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email (pour facture PDF)</label>
                    <input
                      type="email"
                      value={orderForm.customerEmail}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, customerEmail: e.target.value })
                      }
                      placeholder="client@email.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mode de paiement</label>
                    <select
                      value={orderForm.paymentMethod}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, paymentMethod: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                    >
                      <option value="Cash à la livraison">Cash à la livraison</option>
                      <option value="Airtel Money">Airtel Money</option>
                      <option value="Orange Money">Orange Money</option>
                      <option value="M-Pesa">M-Pesa</option>
                      <option value="Wave">Wave</option>
                      <option value="Carte / Virement">Carte / Virement</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Adresse de livraison</label>
                    <input
                      type="text"
                      value={orderForm.deliveryAddress}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, deliveryAddress: e.target.value })
                      }
                      placeholder="Commune, avenue, N°..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Frais livraison ({currSym})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={orderForm.deliveryFee}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, deliveryFee: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Zone / Commune</label>
                    <input
                      type="text"
                      value={orderForm.deliveryZone}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, deliveryZone: e.target.value })
                      }
                      placeholder="Ex: Gombe, Limete, Ngaliema..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Livreur / Coursier</label>
                    <input
                      type="text"
                      value={orderForm.driverName}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, driverName: e.target.value })
                      }
                      placeholder="Nom du livreur (optionnel)"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instructions / Notes commande</label>
                  <input
                    type="text"
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                    placeholder="Ex: Appeler 15 min avant arrivée, couleur demandée..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>

                {/* Sélection produits depuis le catalogue */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <label className="block font-bold text-slate-800">
                    Ajouter des produits au panier *
                  </label>
                  {products.length === 0 ? (
                    <p className="text-[11px] text-amber-700">
                      Votre catalogue est vide. Créez d&apos;abord au moins un produit.
                    </p>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={selectedCartProductId}
                        onChange={(e) => setSelectedCartProductId(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                      >
                        <option value="">-- Choisir un produit --</option>
                        {products.map((p) => {
                          const stk = Number(p.stock || 0);
                          return (
                            <option key={p.id} value={p.id} disabled={stk <= 0}>
                              {p.name} ({formatAmount(p.price, currSym)} •{" "}
                              {stk <= 0 ? "Rupture de stock" : `Stock: ${stk}`})
                            </option>
                          );
                        })}
                      </select>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          value={selectedCartQty}
                          onChange={(e) => setSelectedCartQty(e.target.value)}
                          className="w-20 px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-center"
                        />
                        <button
                          type="button"
                          onClick={handleAddProductToCart}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                  )}

                  {orderCart.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      {orderCart.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-xl border border-slate-200"
                        >
                          <span>
                            <strong>{item.quantity}×</strong> {item.description}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">
                              {formatAmount(item.quantity * item.unitPrice, currSym)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setOrderCart((prev) =>
                                  prev.filter((i) => i.productId !== item.productId)
                                )
                              }
                              className="text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between font-extrabold text-sm text-blue-700 pt-1">
                        <span>Total Commande :</span>
                        <span>{formatAmount(cartTotal, currSym)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || orderCart.length === 0}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Création..." : "Valider la Commande"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

