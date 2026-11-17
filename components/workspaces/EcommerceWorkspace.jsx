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
  Building2,
} from "lucide-react";
import { formatAmount, getCurrencySymbol } from "@/lib/mock-data";
import CalendarDropdown from "@/components/CalendarDropdown";

const ORDER_STATUS_META = {
  nouvelle: {
    label: "Nouvelle",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-600",
    bar: "bg-blue-600",
  },
  confirmee: {
    label: "Confirmée",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-600",
    bar: "bg-indigo-600",
  },
  en_preparation: {
    label: "En préparation",
    badge: "bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]",
    dot: "bg-[#EA580C]",
    bar: "bg-[#EA580C]",
  },
  expediee: {
    label: "En livraison",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-600",
    bar: "bg-purple-600",
  },
  livree: {
    label: "Livrée",
    badge: "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]",
    dot: "bg-[#16A34A]",
    bar: "bg-[#16A34A]",
  },
  annulee: {
    label: "Annulée",
    badge: "bg-[#FFE4E6] text-[#BE123C] border-[#FECDD3]",
    dot: "bg-[#E11D48]",
    bar: "bg-[#E11D48]",
  },
};

export default function EcommerceWorkspace({
  activeSection = "overview", // "overview" | "products" | "orders" | "billing"
  onChangeSection,
  onNavigateTab,
  products = [],
  orders = [],
  invoices = [],
  clients = [],
  companyInfo = {},
  userProfile = null,
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

  const fmtOrderDateStr = (d) => {
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${dt.getFullYear()}`;
  };

  const todayLiveObj = new Date();
  const todayLiveStr = fmtOrderDateStr(todayLiveObj);
  const yesterdayLiveStr = fmtOrderDateStr(
    new Date(todayLiveObj.getFullYear(), todayLiveObj.getMonth(), todayLiveObj.getDate() - 1)
  );
  const tomorrowLiveStr = fmtOrderDateStr(
    new Date(todayLiveObj.getFullYear(), todayLiveObj.getMonth(), todayLiveObj.getDate() + 1)
  );

  const [selectedPeriod, setSelectedPeriod] = useState("Aujourd'hui");
  const [selectedDate, setSelectedDate] = useState(todayLiveStr);
  const [hoveredChartIdx, setHoveredChartIdx] = useState(null);
  const [hoveredStatusKey, setHoveredStatusKey] = useState(null);
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

  const orderCalendarDates = useMemo(() => {
    const set = new Set();
    for (const o of orders) {
      const ds = fmtOrderDateStr(o.createdAt || new Date());
      if (ds) set.add(ds);
    }
    return Array.from(set);
  }, [orders]);

  const applyQuickPeriod = (label) => {
    setSelectedPeriod(label);
    if (label === "Aujourd'hui") setSelectedDate(todayLiveStr);
    else if (label === "Hier") setSelectedDate(yesterdayLiveStr);
    else if (label === "Demain") setSelectedDate(tomorrowLiveStr);
    else setSelectedDate(null);
  };

  const periodOrders = useMemo(() => {
    if (selectedPeriod === "Toutes les dates" && !selectedDate) return orders;

    const now = new Date();
    const isExactDayFilter = Boolean(selectedDate && /^\d{2}\/\d{2}\/\d{4}$/.test(selectedDate));

    return orders.filter((o) => {
      const rawDate = o.createdAt ? new Date(o.createdAt) : now;
      if (Number.isNaN(rawDate.getTime())) return true;
      const ordStr = fmtOrderDateStr(rawDate);

      if (isExactDayFilter) {
        return ordStr === selectedDate;
      }
      if (selectedPeriod === "Aujourd'hui") return ordStr === todayLiveStr;
      if (selectedPeriod === "Hier") return ordStr === yesterdayLiveStr;
      if (selectedPeriod === "Demain") return ordStr === tomorrowLiveStr;
      if (selectedPeriod === "Cette semaine") {
        const diffDays = (now.getTime() - rawDate.getTime()) / 86400000;
        return diffDays >= -1 && diffDays <= 7;
      }
      if (selectedPeriod === "Ce mois-ci") {
        return (
          rawDate.getMonth() === now.getMonth() && rawDate.getFullYear() === now.getFullYear()
        );
      }
      if (selectedPeriod === "Mois précédent") {
        const prevM = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const prevY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return rawDate.getMonth() === prevM && rawDate.getFullYear() === prevY;
      }
      return true;
    });
  }, [orders, selectedPeriod, selectedDate, todayLiveStr, yesterdayLiveStr, tomorrowLiveStr]);

  const metrics = useMemo(() => {
    const activeOrders = periodOrders.filter((o) => o.orderStatus !== "annulee");
    const totalRevenue = activeOrders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
    const paidOrders = activeOrders.filter((o) => o.paymentStatus === "paye");
    const paidRevenue = paidOrders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
    const pendingRevenue = Math.max(0, totalRevenue - paidRevenue);
    const collectionRate = totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0;

    const pendingLogisticsCount = activeOrders.filter((o) =>
      ["nouvelle", "confirmee", "en_preparation"].includes(o.orderStatus)
    ).length;
    const shippingCount = activeOrders.filter((o) => o.orderStatus === "expediee").length;
    const deliveredCount = activeOrders.filter((o) => o.orderStatus === "livree").length;
    const cancelledCount = periodOrders.filter((o) => o.orderStatus === "annulee").length;
    const deliveryRate =
      activeOrders.length > 0 ? Math.round((deliveredCount / activeOrders.length) * 100) : 0;
    const unbilledOrders = activeOrders.filter((o) => !o.invoiceId);
    const unbilledCount = unbilledOrders.length;
    const unbilledAmount = unbilledOrders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
    const lowStockProducts = products.filter((p) => Number(p.stock || 0) <= 5);
    const totalStockUnits = products.reduce((acc, p) => acc + Number(p.stock || 0), 0);
    const avgBasket = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;

    const pipelineStages = ["nouvelle", "confirmee", "en_preparation", "expediee", "livree"].map(
      (key) => {
        const list = activeOrders.filter((o) => o.orderStatus === key);
        return {
          key,
          ...ORDER_STATUS_META[key],
          count: list.length,
          amount: list.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0),
        };
      }
    );

    const statusDonutData = [
      {
        key: "pending_logistics",
        label: "En attente",
        sub: "Nouvelles / Préparation",
        count: pendingLogisticsCount,
        color: "#EA580C",
        badgeClass: "bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]",
      },
      {
        key: "expediee",
        label: "En expédition",
        sub: "En cours de livraison",
        count: shippingCount,
        color: "#2563EB",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      },
      {
        key: "livree",
        label: "Livrées",
        sub: "Remises au client",
        count: deliveredCount,
        color: "#16A34A",
        badgeClass: "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]",
      },
    ];

    const channelMap = {};
    for (const o of activeOrders) {
      const m = o.paymentMethod || "Cash à la livraison";
      if (!channelMap[m]) channelMap[m] = { method: m, count: 0, amount: 0 };
      channelMap[m].count += 1;
      channelMap[m].amount += Number(o.totalAmount || 0);
    }
    const paymentChannels = Object.values(channelMap).sort((a, b) => b.amount - a.amount);

    return {
      totalOrders: periodOrders.length,
      activeOrdersCount: activeOrders.length,
      totalRevenue,
      paidRevenue,
      paidOrdersCount: paidOrders.length,
      pendingRevenue,
      collectionRate,
      pendingLogisticsCount,
      shippingCount,
      deliveredCount,
      cancelledCount,
      deliveryRate,
      unbilledCount,
      unbilledAmount,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      totalStockUnits,
      avgBasket,
      pipelineStages,
      statusDonutData,
      paymentChannels,
    };
  }, [periodOrders, products]);

  // Série graphique dynamique : Argent encaissé vs Nombre de commandes reçues (horaire pour 1 jour, journalier pour multi-jours)
  const chartSeries = useMemo(() => {
    const isSingleDay =
      Boolean(selectedDate && /^\d{2}\/\d{2}\/\d{4}$/.test(selectedDate)) ||
      selectedPeriod === "Aujourd'hui" ||
      selectedPeriod === "Hier" ||
      selectedPeriod === "Demain";

    if (isSingleDay) {
      const slots = [
        { label: "00h-06h", minH: 0, maxH: 6 },
        { label: "06h-10h", minH: 6, maxH: 10 },
        { label: "10h-14h", minH: 10, maxH: 14 },
        { label: "14h-18h", minH: 14, maxH: 18 },
        { label: "18h-22h", minH: 18, maxH: 22 },
        { label: "22h-00h", minH: 22, maxH: 24 },
      ];
      return slots.map((s) => {
        const slotOrders = periodOrders.filter((o) => {
          if (o.orderStatus === "annulee") return false;
          const dt = o.createdAt ? new Date(o.createdAt) : new Date();
          const hr = Number.isNaN(dt.getTime()) ? 12 : dt.getHours();
          return hr >= s.minH && hr < s.maxH;
        });
        const orderCount = slotOrders.length;
        const orderedAmount = slotOrders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
        const collectedAmount = slotOrders
          .filter((o) => o.paymentStatus === "paye")
          .reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
        return {
          label: s.label,
          orderCount,
          orderedAmount,
          collectedAmount,
        };
      });
    }

    // Multi-jours : 7 derniers jours (ou derniers jours actifs)
    const buckets = [];
    const baseNow = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseNow.getFullYear(), baseNow.getMonth(), baseNow.getDate() - i);
      const dStr = fmtOrderDateStr(d);
      const dayLabel = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const dayOrders = periodOrders.filter((o) => {
        if (o.orderStatus === "annulee") return false;
        const oStr = fmtOrderDateStr(o.createdAt || baseNow);
        return oStr === dStr;
      });
      buckets.push({
        label: dayLabel,
        orderCount: dayOrders.length,
        orderedAmount: dayOrders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0),
        collectedAmount: dayOrders
          .filter((o) => o.paymentStatus === "paye")
          .reduce((acc, o) => acc + Number(o.totalAmount || 0), 0),
      });
    }
    return buckets;
  }, [periodOrders, selectedPeriod, selectedDate]);

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
          : effectiveOrderFilter === "pending_logistics"
          ? ["nouvelle", "confirmee", "en_preparation"].includes(o.orderStatus)
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
    { id: "overview", label: "Tableau de bord e-commerce", icon: ShoppingBag },
    { id: "products", label: `Catalogue produits (${products.length})`, icon: Package },
    { id: "orders", label: `Commandes & Livraisons (${orders.length})`, icon: Truck },
    { id: "billing", label: `Gestion de facturation (${metrics.unbilledCount})`, icon: Receipt },
  ];

  const heroBySection = {
    overview: {
      badge: "TOUR DE CONTRÔLE",
      title: "Tableau de bord e-commerce",
      subtitle: `Synthèse de vos ventes, suivi des livraisons et facturation en ${currSym} pour ${
        companyInfo?.name || "votre boutique"
      }`,
    },
    products: {
      badge: "CATALOGUE BOUTIQUE",
      title: "Catalogue produits",
      subtitle: `Gérez vos articles, tarifs en ${currSym} et niveaux de stock disponibles pour ${
        companyInfo?.name || "votre boutique"
      }`,
    },
    orders: {
      badge: "COMMANDES & EXPÉDITIONS",
      title: "Commandes & Livraisons",
      subtitle: `Suivez vos paniers, livreurs, zones d'expédition et encaissements en ${currSym}`,
    },
    billing: {
      badge: "FIN DE CYCLE",
      title: "Gestion de facturation",
      subtitle: `Convertissez vos commandes en factures officielles, téléchargez le PDF et envoyez au client`,
    },
  };

  const currentHero = heroBySection[activeSection] || heroBySection.overview;

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-200">
      {/* BANNIÈRE DE BIENVENUE (Uniquement sur Tableau de bord e-commerce — Design System B2B 1:1) */}
      {activeSection === "overview" && (
        <div className="bg-gradient-to-r from-[#1A44B8] via-[#163DA9] to-[#2D60FF] rounded-2xl p-4 sm:p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-base sm:text-lg font-extrabold shadow-inner shrink-0">
              {userProfile?.initials || companyInfo?.initials || "FX"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight">
                  Bonjour, {userProfile?.fullName || "Commerçant"}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  En ligne
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100/90 mt-1 break-words">
                Espace <strong>E-Commerce</strong> ({userProfile?.badge || userProfile?.role || "Gérant"}) chez{" "}
                <span className="underline decoration-blue-300 font-bold">
                  {companyInfo?.name || userProfile?.companyName || "Ma Boutique"}
                </span>
              </p>
            </div>
          </div>

          {onNavigateTab && (userProfile?.role === "admin" || !userProfile?.role) && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => onNavigateTab("company")}
                className="px-3.5 py-2 bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/20 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-200" />
                <span>Mon Entreprise</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* HERO SECTION SPÉCIFIQUE À LA PAGE ACTIVE (Nom exact de chaque page) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-[#183BB0] border border-blue-200">
              {currentHero.badge}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Données synchronisées en direct
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            {currentHero.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {currentHero.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeSection === "overview" && (
            <CalendarDropdown
              selectedPeriod={selectedPeriod}
              onSelectPeriod={setSelectedPeriod}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              invoiceDates={orderCalendarDates}
              useLiveDates={true}
              dotLabel="Commandes enregistrées"
              buttonClassName="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer transition-colors"
              align="right"
            />
          )}

          {(activeSection === "overview" || activeSection === "products") && (
            <button
              type="button"
              onClick={openNewProductModal}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                activeSection === "products"
                  ? "bg-[#183BB0] hover:bg-[#122F8C] text-white shadow-md shadow-blue-900/20"
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{activeSection === "products" ? "Ajouter un produit" : "Nouveau Produit"}</span>
            </button>
          )}

          {(activeSection === "overview" || activeSection === "orders") && (
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(true)}
              className="px-4 py-2 bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-blue-900/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Commande</span>
            </button>
          )}

          {activeSection === "billing" && (
            <button
              type="button"
              onClick={() => onChangeSection && onChangeSection("invoices")}
              className="px-4 py-2 bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-blue-900/20 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Registre Factures ({invoices.length})</span>
            </button>
          )}
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

      {/* VUE 1 : TABLEAU DE BORD E-COMMERCE OPTIMISÉ (DESIGN SYSTEM B2B 1:1) */}
      {activeSection === "overview" && (
        <div className="space-y-6">
          {/* Barre de raccourcis rapides de période (Aujourd'hui / Hier / Demain / Semaine / Toutes les dates) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Période :
              </span>
              {["Aujourd'hui", "Hier", "Demain", "Cette semaine", "Ce mois-ci", "Toutes les dates"].map(
                (label) => {
                  const isAct = selectedPeriod === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => applyQuickPeriod(label)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isAct
                          ? "bg-[#183BB0] text-white shadow-xs"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {label}
                    </button>
                  );
                }
              )}
            </div>
            {periodOrders.length === 0 && orders.length > 0 && (
              <button
                type="button"
                onClick={() => applyQuickPeriod("Toutes les dates")}
                className="text-xs font-bold text-blue-600 hover:underline shrink-0 text-left sm:text-right cursor-pointer"
              >
                {orders.length} commande(s) sur l&apos;historique complet →
              </button>
            )}
          </div>

          {/* 4 Cartes KPIs Opérationnelles (Commandes reçues • Argent encaissé • En attente / Expédition • Livrées) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* KPI 1 : Commandes reçues sur la période */}
            <div
              onClick={() => {
                setOrderFilter("all");
                onChangeSection && onChangeSection("orders");
              }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {selectedPeriod}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4">
                Commandes reçues
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                {metrics.totalOrders}
              </p>
              <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                <span>Volume : {formatAmount(metrics.totalRevenue, currSym)}</span>
                <span className="text-blue-600 font-bold">Voir →</span>
              </p>
            </div>

            {/* KPI 2 : Argent encaissé vs commandes reçues */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                  {metrics.collectionRate}% encaissé
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4">
                Argent encaissé
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                {formatAmount(metrics.paidRevenue, currSym)}
              </p>
              <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                <span>
                  Sur {metrics.paidOrdersCount}/{metrics.activeOrdersCount} cmd payées
                </span>
                <span className="text-amber-700 font-semibold">
                  Reste : {formatAmount(metrics.pendingRevenue, currSym)}
                </span>
              </p>
            </div>

            {/* KPI 3 : En attente & En expédition */}
            <div
              onClick={() => {
                setOrderFilter("expediee");
                onChangeSection && onChangeSection("orders");
              }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                  {metrics.shippingCount} en expédition
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4">
                En attente / Expédition
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                {metrics.pendingLogisticsCount}{" "}
                <span className="text-base font-bold text-slate-400">
                  / {metrics.shippingCount}
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                <span>{metrics.pendingLogisticsCount} en attente</span>
                <span className="text-blue-600 font-bold">Suivre →</span>
              </p>
            </div>

            {/* KPI 4 : Livrées & À facturer */}
            <div
              onClick={() => onChangeSection && onChangeSection("billing")}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#183BB0] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    metrics.unbilledCount > 0
                      ? "bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]"
                      : "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]"
                  }`}
                >
                  {metrics.unbilledCount} à facturer
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4">
                Commandes livrées
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                {metrics.deliveredCount}
              </p>
              <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                <span>{metrics.deliveryRate}% de livraison</span>
                <span className="text-blue-600 font-bold flex items-center gap-1">
                  Facturer <ArrowRight className="w-3 h-3" />
                </span>
              </p>
            </div>
          </div>

          {/* GRAPHIQUES INTERACTIFS : (1) Argent Encaissé vs Commandes Reçues + (2) Statuts Logistiques */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* GRAPHIQUE 1 (2/3) : Argent encaissé par rapport aux commandes reçues */}
            {(() => {
              const svgW = 640;
              const svgH = 230;
              const padL = 44;
              const padR = 24;
              const padT = 22;
              const padB = 34;
              const plotW = svgW - padL - padR;
              const plotH = svgH - padT - padB;

              const maxCash = Math.max(
                1000,
                ...chartSeries.map((d) => Math.max(d.orderedAmount, d.collectedAmount))
              );
              const maxCnt = Math.max(1, ...chartSeries.map((d) => d.orderCount));
              const stepX = chartSeries.length > 1 ? plotW / (chartSeries.length - 1) : plotW / 2;

              const getX = (idx) =>
                chartSeries.length > 1 ? padL + idx * stepX : padL + plotW / 2;
              const getYCash = (val) => padT + plotH - (val / maxCash) * plotH;
              const getYCntHeight = (cnt) => (cnt / maxCnt) * (plotH * 0.72);

              const buildSmoothPath = (pts) => {
                if (pts.length === 0) return "";
                if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
                let d = `M ${pts[0].x} ${pts[0].y}`;
                for (let i = 0; i < pts.length - 1; i++) {
                  const p0 = pts[i];
                  const p1 = pts[i + 1];
                  const cx = (p0.x + p1.x) / 2;
                  d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
                }
                return d;
              };

              const collectedPts = chartSeries.map((d, i) => ({
                x: getX(i),
                y: getYCash(d.collectedAmount),
              }));
              const orderedPts = chartSeries.map((d, i) => ({
                x: getX(i),
                y: getYCash(d.orderedAmount),
              }));

              const collectedLinePath = buildSmoothPath(collectedPts);
              const orderedLinePath = buildSmoothPath(orderedPts);
              const collectedAreaPath =
                collectedPts.length > 0
                  ? `${collectedLinePath} L ${collectedPts[collectedPts.length - 1].x} ${
                      padT + plotH
                    } L ${collectedPts[0].x} ${padT + plotH} Z`
                  : "";

              const activePoint =
                hoveredChartIdx !== null && chartSeries[hoveredChartIdx]
                  ? chartSeries[hoveredChartIdx]
                  : null;

              return (
                <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-slate-900">
                          Argent Encaissé vs Commandes Reçues
                        </h2>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#183BB0] border border-blue-100">
                          {selectedDate || selectedPeriod}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Comparaison en direct entre le nombre de commandes reçues, le volume commandé et l&apos;argent encaissé
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold shrink-0">
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-xs bg-blue-200 border border-blue-400" />
                        Nb commandes
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-emerald-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                        Encaissé
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[#183BB0]">
                        <span className="w-3 h-0.5 bg-[#183BB0]" />
                        Commandé
                      </span>
                    </div>
                  </div>

                  {/* Barre de détail dynamique au survol */}
                  <div className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {activePoint ? (
                      <>
                        <span className="font-extrabold text-slate-900">
                          Créneau / Jour : {activePoint.label}
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-bold text-blue-700">
                            {activePoint.orderCount} commande(s) reçue(s)
                          </span>
                          <span className="font-bold text-emerald-700">
                            Encaissé : {formatAmount(activePoint.collectedAmount, currSym)}
                          </span>
                          <span className="text-slate-500 font-semibold">
                            Commandé : {formatAmount(activePoint.orderedAmount, currSym)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-600 font-semibold">
                          Synthèse ({selectedPeriod}) :{" "}
                          <strong className="text-slate-900">{metrics.totalOrders}</strong>{" "}
                          commande(s) reçue(s)
                        </span>
                        <span className="font-bold text-emerald-700">
                          {formatAmount(metrics.paidRevenue, currSym)} encaissés /{" "}
                          {formatAmount(metrics.totalRevenue, currSym)} ({metrics.collectionRate}%)
                        </span>
                      </>
                    )}
                  </div>

                  {/* SVG Graphique */}
                  <div className="w-full overflow-x-auto">
                    <svg
                      viewBox={`0 0 ${svgW} ${svgH}`}
                      className="w-full h-52 sm:h-60 min-w-[320px] select-none"
                    >
                      <defs>
                        <linearGradient id="ecomCashGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#16A34A" stopOpacity="0.24" />
                          <stop offset="100%" stopColor="#16A34A" stopOpacity="0.01" />
                        </linearGradient>
                      </defs>

                      {/* Lignes de grille horizontales */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                        const y = padT + plotH - ratio * plotH;
                        const labelVal = Math.round(maxCash * ratio);
                        return (
                          <g key={idx}>
                            <line
                              x1={padL}
                              y1={y}
                              x2={svgW - padR}
                              y2={y}
                              stroke="#E2E8F0"
                              strokeDasharray="3 3"
                              strokeWidth="1"
                            />
                            <text
                              x={padL - 6}
                              y={y + 3}
                              textAnchor="end"
                              fontSize="9"
                              fill="#94A3B8"
                              fontWeight="600"
                            >
                              {labelVal >= 1000 ? `${Math.round(labelVal / 1000)}k` : labelVal}
                            </text>
                          </g>
                        );
                      })}

                      {/* Barres : Nombre de commandes reçues */}
                      {chartSeries.map((d, i) => {
                        const cx = getX(i);
                        const barW = Math.min(34, plotW / chartSeries.length / 2);
                        const barH = d.orderCount > 0 ? Math.max(8, getYCntHeight(d.orderCount)) : 0;
                        const isHov = hoveredChartIdx === i;
                        return (
                          <g
                            key={d.label}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredChartIdx(i)}
                            onMouseLeave={() => setHoveredChartIdx(null)}
                            onClick={() => setHoveredChartIdx(i)}
                          >
                            <rect
                              x={cx - barW / 2}
                              y={padT + plotH - barH}
                              width={barW}
                              height={barH}
                              rx="6"
                              fill={isHov ? "#2563EB" : "#BFDBFE"}
                              opacity={isHov ? "0.9" : "0.75"}
                            />
                            {d.orderCount > 0 && (
                              <text
                                x={cx}
                                y={padT + plotH - barH - 5}
                                textAnchor="middle"
                                fontSize="9.5"
                                fontWeight="800"
                                fill={isHov ? "#183BB0" : "#3B82F6"}
                              >
                                {d.orderCount} cmd
                              </text>
                            )}
                            {/* Label axe X */}
                            <text
                              x={cx}
                              y={svgH - 10}
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight={isHov ? "800" : "600"}
                              fill={isHov ? "#183BB0" : "#64748B"}
                            >
                              {d.label}
                            </text>
                          </g>
                        );
                      })}

                      {/* Aire + Courbe Montant Commandé (pointillée) */}
                      <path
                        d={orderedLinePath}
                        fill="none"
                        stroke="#183BB0"
                        strokeWidth="2"
                        strokeDasharray="5 4"
                        opacity="0.7"
                      />

                      {/* Aire + Courbe Argent Encaissé */}
                      {collectedAreaPath && (
                        <path d={collectedAreaPath} fill="url(#ecomCashGrad)" />
                      )}
                      <path
                        d={collectedLinePath}
                        fill="none"
                        stroke="#16A34A"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Points sur les courbes */}
                      {collectedPts.map((pt, i) => {
                        const isHov = hoveredChartIdx === i;
                        return (
                          <g key={`pt-${i}`}>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isHov ? 6 : 4}
                              fill="#FFFFFF"
                              stroke="#16A34A"
                              strokeWidth="2.5"
                            />
                            <circle
                              cx={orderedPts[i].x}
                              cy={orderedPts[i].y}
                              r={isHov ? 5 : 3}
                              fill="#183BB0"
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              );
            })()}

            {/* GRAPHIQUE 2 (1/3) : Répartition Commandes (Reçues • En attente • En expédition • Livrées) */}
            {(() => {
              const totalStatusCount = Math.max(
                1,
                metrics.pendingLogisticsCount + metrics.shippingCount + metrics.deliveredCount
              );
              const radius = 56;
              const circ = 2 * Math.PI * radius;
              let accOffset = 0;

              const donutSegments = metrics.statusDonutData.map((seg) => {
                const len = (seg.count / totalStatusCount) * circ;
                const offset = accOffset;
                accOffset += len;
                return { ...seg, len, offset };
              });

              return (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      État des Commandes
                    </h2>
                    <p className="text-xs text-slate-500">
                      Reçues, en attente, en expédition et livrées ({selectedPeriod})
                    </p>
                  </div>

                  {/* Donut SVG + Total Reçues au centre */}
                  <div className="flex items-center justify-center py-1">
                    <div className="relative w-40 h-40">
                      <svg viewBox="0 0 144 144" className="w-full h-full -rotate-90">
                        <circle
                          cx="72"
                          cy="72"
                          r={radius}
                          fill="none"
                          stroke="#F1F5F9"
                          strokeWidth="16"
                        />
                        {metrics.activeOrdersCount > 0 &&
                          donutSegments.map((seg) =>
                            seg.count > 0 ? (
                              <circle
                                key={seg.key}
                                cx="72"
                                cy="72"
                                r={radius}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth={hoveredStatusKey === seg.key ? "19" : "16"}
                                strokeDasharray={`${seg.len} ${circ - seg.len}`}
                                strokeDashoffset={-seg.offset}
                                strokeLinecap="butt"
                                className="transition-all duration-200 cursor-pointer"
                                onMouseEnter={() => setHoveredStatusKey(seg.key)}
                                onMouseLeave={() => setHoveredStatusKey(null)}
                                onClick={() => {
                                  setOrderFilter(seg.key);
                                  onChangeSection && onChangeSection("orders");
                                }}
                              />
                            ) : null
                          )}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="text-2xl font-extrabold text-slate-900 leading-none">
                          {metrics.totalOrders}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                          Reçues
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Légende cliquable avec compteurs exacts */}
                  <div className="space-y-2">
                    {metrics.statusDonutData.map((seg) => {
                      const pct =
                        metrics.activeOrdersCount > 0
                          ? Math.round((seg.count / metrics.activeOrdersCount) * 100)
                          : 0;
                      return (
                        <button
                          key={seg.key}
                          type="button"
                          onMouseEnter={() => setHoveredStatusKey(seg.key)}
                          onMouseLeave={() => setHoveredStatusKey(null)}
                          onClick={() => {
                            setOrderFilter(seg.key);
                            onChangeSection && onChangeSection("orders");
                          }}
                          className="w-full p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-blue-50/60 border border-slate-100 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: seg.color }}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {seg.label}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">{seg.sub}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-extrabold text-slate-900">
                              {seg.count}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 ml-1">
                              ({pct}%)
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Pipeline Opérationnel des Commandes (Cliquable par étape) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Suivi des Commandes par Étape
                </h2>
                <p className="text-xs text-slate-500">
                  Cliquez sur une étape pour filtrer directement les commandes correspondantes
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOrderFilter("all");
                  onChangeSection && onChangeSection("orders");
                }}
                className="text-xs font-bold text-blue-600 hover:underline self-start sm:self-auto cursor-pointer"
              >
                Ouvrir le suivi complet →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {metrics.pipelineStages.map((stage) => {
                const share =
                  metrics.activeOrdersCount > 0
                    ? Math.round((stage.count / metrics.activeOrdersCount) * 100)
                    : 0;
                return (
                  <button
                    key={stage.key}
                    type="button"
                    onClick={() => {
                      setOrderFilter(stage.key);
                      onChangeSection && onChangeSection("orders");
                    }}
                    className="p-3.5 rounded-2xl bg-[#F8FAFC] hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                        {stage.label}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900">{stage.count}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-600 mt-2">
                      {formatAmount(stage.amount, currSym)}
                    </p>
                    <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full ${stage.bar}`}
                        style={{ width: `${Math.max(share, stage.count > 0 ? 10 : 0)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grille Principale 2 Colonnes : Trésorerie & Alertes Stock | Commandes Récentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne Gauche : Encaissements par canal & Alertes Stock */}
            <div className="space-y-6">
              {/* Encaissements & Canaux Mobile Money / Cash */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Encaissements &amp; Modes de Paiement
                    </h2>
                    <p className="text-xs text-slate-500">
                      Répartition réelle des règlements boutique
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {metrics.totalRevenue > 0
                      ? Math.round((metrics.paidRevenue / metrics.totalRevenue) * 100)
                      : 0}
                    % encaissé
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <p className="text-[11px] font-bold text-emerald-700 uppercase">Encaissé</p>
                    <p className="text-base font-extrabold text-emerald-900 mt-0.5">
                      {formatAmount(metrics.paidRevenue, currSym)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                    <p className="text-[11px] font-bold text-amber-800 uppercase">À recevoir</p>
                    <p className="text-base font-extrabold text-amber-950 mt-0.5">
                      {formatAmount(metrics.pendingRevenue, currSym)}
                    </p>
                  </div>
                </div>

                {metrics.paymentChannels.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Aucun paiement enregistré sur cette période.
                  </p>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    {metrics.paymentChannels.map((ch) => {
                      const pct =
                        metrics.totalRevenue > 0
                          ? Math.round((ch.amount / metrics.totalRevenue) * 100)
                          : 0;
                      return (
                        <div key={ch.method} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">
                              {ch.method} ({ch.count})
                            </span>
                            <span className="font-bold text-slate-900">
                              {formatAmount(ch.amount, currSym)} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${Math.max(pct, 4)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Alertes Stock Faible */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    Alertes Stock &amp; Réapprovisionnement
                  </h2>
                  <button
                    type="button"
                    onClick={() => onChangeSection && onChangeSection("products")}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Catalogue →
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="py-4 text-center space-y-2">
                    <p className="text-xs text-slate-500">
                      Aucun produit dans votre catalogue pour le moment.
                    </p>
                    <button
                      type="button"
                      onClick={openNewProductModal}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                    >
                      + Ajouter mon premier produit
                    </button>
                  </div>
                ) : metrics.lowStockProducts.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tous vos {products.length} produits ont un stock suffisant (&gt; 5 unités).</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {metrics.lowStockProducts.slice(0, 4).map((prod) => (
                      <div
                        key={prod.id}
                        className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                          <p className="text-[11px] text-rose-600 font-semibold">
                            {Number(prod.stock || 0) <= 0
                              ? "Rupture de stock"
                              : `Plus que ${prod.stock} en stock`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditProductModal(prod)}
                          className="shrink-0 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 text-xs font-bold cursor-pointer"
                        >
                          Réapprovisionner
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Colonne Droite : Commandes Récentes & Facturation rapide (style DashboardRecentInvoices.jsx) */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 flex flex-col">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Commandes Récentes &amp; Facturation
                  </h2>
                  <p className="text-xs text-slate-500">
                    Passez directement de la commande à la facture client en 1 clic
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChangeSection && onChangeSection("orders")}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer shrink-0"
                >
                  Tout voir →
                </button>
              </div>

              {periodOrders.length === 0 ? (
                <div className="flex-1 py-10 text-center space-y-3 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Aucune commande enregistrée sur cette période. Créez un produit puis passez votre première commande.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsOrderModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                  >
                    + Nouvelle Commande
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 flex-1">
                  {periodOrders.slice(0, 6).map((ord) => {
                    const st = ORDER_STATUS_META[ord.orderStatus] || ORDER_STATUS_META.nouvelle;
                    const isPaid = ord.paymentStatus === "paye";
                    const linkedInvoice = ord.invoiceId
                      ? invoices.find((inv) => inv.id === ord.invoiceId)
                      : null;
                    return (
                      <div
                        key={ord.id}
                        className="p-3.5 rounded-2xl border border-slate-100 bg-[#F8FAFC] hover:bg-white hover:border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-extrabold text-slate-900">
                              {ord.id}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${st.badge}`}
                            >
                              {st.label}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isPaid
                                  ? "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]"
                                  : "bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]"
                              }`}
                            >
                              {isPaid ? "Payée" : "En attente"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 truncate">
                            <strong>{ord.customerName}</strong> • {ord.deliveryZone} • {ord.paymentMethod}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                          <span className="text-sm font-extrabold text-slate-900">
                            {formatAmount(ord.totalAmount, currSym)}
                          </span>
                          {linkedInvoice ? (
                            <button
                              type="button"
                              onClick={() => onOpenInvoice && onOpenInvoice(linkedInvoice)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold cursor-pointer"
                            >
                              Facture
                            </button>
                          ) : (
                            ord.orderStatus !== "annulee" && (
                              <button
                                type="button"
                                onClick={() => handleInvoiceOrder(ord)}
                                disabled={invoicingOrderId === ord.id}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                              >
                                {invoicingOrderId === ord.id ? "..." : "Facturer"}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Rappel Cycle E-Commerce -> Gestion de Facturation */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-500">
                  Fin de cycle : <strong>{metrics.unbilledCount}</strong> commande(s) à facturer
                </span>
                <button
                  type="button"
                  onClick={() => onChangeSection && onChangeSection("billing")}
                  className="font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Ouvrir Gestion de facturation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
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
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-slate-900">
                  Commandes en attente de facturation
                </p>
                <p className="text-slate-500 mt-0.5">
                  Convertissez vos commandes en factures PDF et envoyez-les directement à vos clients par email.
                </p>
              </div>
              <span className="shrink-0 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 font-bold text-blue-700">
                {metrics.unbilledCount} commande(s) à facturer
              </span>
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
                <option value="pending_logistics">En attente (Nouvelles / Préparation)</option>
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

