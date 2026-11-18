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
  Download,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Copy,
  PauseCircle,
  PlayCircle,
  Image as ImageIcon,
  Upload,
  Minus,
  Share2,
  Barcode,
  Tag,
  Printer,
  UserCheck,
} from "lucide-react";
import { formatAmount, getCurrencySymbol } from "@/lib/mock-data";
import { exportEcommerceOrdersToXLSX, exportEcommerceCatalogToXLSX } from "@/lib/export-utils";
import { generateReportPdf } from "@/lib/pdf-generator";
import CalendarDropdown from "@/components/CalendarDropdown";
import { BarcodeLabelModal, BulkCatalogImportModal } from "./EcommerceCatalogModals";
import { EditOrderDeliveryModal, DeliverySlipModal } from "./EcommerceOrderModals";

function getEffectiveProductPrice(prod) {
  const base = Number(prod?.price || 0);
  const promo = Number(prod?.promoPrice || 0);
  return promo > 0 && promo < base ? promo : base;
}

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
  onCreateProductsBulk,
  onUpdateProduct,
  onDeleteProduct,
  onCreateOrder,
  onUpdateOrder,
  onDeleteOrder,
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
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productStockFilter, setProductStockFilter] = useState("all"); // "all" | "in_stock" | "low" | "out" | "paused"
  const [productSort, setProductSort] = useState("recent"); // "recent" | "price_asc" | "price_desc" | "stock_asc" | "name_asc"
  const [productViewMode, setProductViewMode] = useState("grid"); // "grid" | "table"
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderDriverFilter, setOrderDriverFilter] = useState("all");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("all"); // "all" | "paye" | "en_attente"
  const [orderSort, setOrderSort] = useState("recent"); // "recent" | "amount_desc" | "amount_asc"
  const [editingDeliveryOrder, setEditingDeliveryOrder] = useState(null);
  const [slipOrder, setSlipOrder] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  // Modales Produit, Import, Étiquettes & Commande
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    category: "Général",
    price: "",
    promoPrice: "",
    costPrice: "",
    stock: "10",
    imageUrl: "",
    variants: [],
    description: "",
    isActive: true,
  });
  const [newVariantLabel, setNewVariantLabel] = useState("");
  const [newVariantStock, setNewVariantStock] = useState("");
  const [labelModalProducts, setLabelModalProducts] = useState(null); // null or array of products
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

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
  const [selectedCartVariant, setSelectedCartVariant] = useState("");
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
    const cancelledOrders = periodOrders.filter((o) => o.orderStatus === "annulee");
    const cancelledCount = cancelledOrders.length;
    const cancelledAmount = cancelledOrders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
    const cancellationRate =
      periodOrders.length > 0 ? Math.round((cancelledCount / periodOrders.length) * 100) : 0;
    const deliveryRate =
      activeOrders.length > 0 ? Math.round((deliveredCount / activeOrders.length) * 100) : 0;
    const unbilledOrders = activeOrders.filter((o) => !o.invoiceId);
    const unbilledCount = unbilledOrders.length;
    const unbilledAmount = unbilledOrders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
    const lowStockProducts = products.filter((p) => Number(p.stock || 0) <= 5);
    const totalStockUnits = products.reduce((acc, p) => acc + Number(p.stock || 0), 0);
    const avgBasket = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;

    // Top Produits Vendus sur la période
    const productSalesMap = {};
    for (const o of activeOrders) {
      for (const it of o.items || []) {
        const key = it.productId || it.description || "Article";
        const name = it.description || "Article";
        const qty = Number(it.quantity || 1);
        const rev = qty * Number(it.unitPrice || 0);
        if (!productSalesMap[key]) {
          productSalesMap[key] = { key, name, quantity: 0, revenue: 0 };
        }
        productSalesMap[key].quantity += qty;
        productSalesMap[key].revenue += rev;
      }
    }
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity)
      .slice(0, 5);

    const pipelineStages = [
      "nouvelle",
      "confirmee",
      "en_preparation",
      "expediee",
      "livree",
      "annulee",
    ].map((key) => {
      const list = periodOrders.filter((o) => o.orderStatus === key);
      return {
        key,
        ...ORDER_STATUS_META[key],
        count: list.length,
        amount: list.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0),
      };
    });

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
      cancelledOrders,
      cancelledCount,
      cancelledAmount,
      cancellationRate,
      deliveryRate,
      unbilledCount,
      unbilledAmount,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      totalStockUnits,
      avgBasket,
      topProducts,
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

  const catalogStats = useMemo(() => {
    const soldByProduct = {};
    for (const o of orders) {
      if (o.orderStatus === "annulee") continue;
      for (const it of o.items || []) {
        const key = it.productId || it.description;
        if (!key) continue;
        soldByProduct[key] = (soldByProduct[key] || 0) + Number(it.quantity || 1);
      }
    }

    const categoriesSet = new Set();
    let activeCount = 0;
    let pausedCount = 0;
    let totalStockUnits = 0;
    let stockRetailValue = 0;
    let stockCostValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      const cat = (p.category || "Général").trim();
      if (cat) categoriesSet.add(cat);
      if (p.isActive !== false) activeCount += 1;
      else pausedCount += 1;
      const stk = Number(p.stock || 0);
      const pr = getEffectiveProductPrice(p);
      const cp = Number(p.costPrice || 0);
      totalStockUnits += stk;
      stockRetailValue += stk * pr;
      stockCostValue += stk * (cp > 0 ? cp : 0);
      if (stk <= 0) outOfStockCount += 1;
      else if (stk <= 5) lowStockCount += 1;
    }

    return {
      totalCount: products.length,
      activeCount,
      pausedCount,
      totalStockUnits,
      stockRetailValue,
      stockCostValue,
      potentialMargin: Math.max(0, stockRetailValue - stockCostValue),
      lowStockCount,
      outOfStockCount,
      categories: Array.from(categoriesSet).sort(),
      soldByProduct,
    };
  }, [products, orders]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const list = products.filter((p) => {
      const matchQuery =
        !q ||
        (p.name || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q);
      const matchCategory =
        productCategoryFilter === "all" ||
        (p.category || "Général").trim() === productCategoryFilter;
      const stk = Number(p.stock || 0);
      const matchStock =
        productStockFilter === "all"
          ? true
          : productStockFilter === "in_stock"
          ? stk > 5 && p.isActive !== false
          : productStockFilter === "low"
          ? stk > 0 && stk <= 5
          : productStockFilter === "out"
          ? stk <= 0
          : p.isActive === false;
      return matchQuery && matchCategory && matchStock;
    });

    const sorted = [...list];
    if (productSort === "price_asc") {
      sorted.sort((a, b) => getEffectiveProductPrice(a) - getEffectiveProductPrice(b));
    } else if (productSort === "price_desc") {
      sorted.sort((a, b) => getEffectiveProductPrice(b) - getEffectiveProductPrice(a));
    } else if (productSort === "stock_asc") {
      sorted.sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
    } else if (productSort === "name_asc") {
      sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    return sorted;
  }, [products, productSearch, productCategoryFilter, productStockFilter, productSort]);

  const NEXT_ORDER_STEP = {
    nouvelle: { nextStatus: "confirmee", buttonLabel: "Confirmer" },
    confirmee: { nextStatus: "en_preparation", buttonLabel: "Préparer" },
    en_preparation: { nextStatus: "expediee", buttonLabel: "Expédier" },
    expediee: { nextStatus: "livree", buttonLabel: "Marquer Livrée" },
  };

  const orderStats = useMemo(() => {
    const driversSet = new Set();
    let toPrepareCount = 0;
    let shippingCount = 0;
    let deliveredCount = 0;
    let unbilledCount = 0;
    let unassignedDriverCount = 0;
    let totalVolume = 0;

    for (const o of orders) {
      if (o.driverName && o.driverName.trim()) driversSet.add(o.driverName.trim());
      if (o.orderStatus === "annulee") continue;
      totalVolume += Number(o.totalAmount || 0);
      if (["nouvelle", "confirmee", "en_preparation"].includes(o.orderStatus)) {
        toPrepareCount += 1;
      } else if (o.orderStatus === "expediee") {
        shippingCount += 1;
      } else if (o.orderStatus === "livree") {
        deliveredCount += 1;
      }
      if (!o.invoiceId) unbilledCount += 1;
      if (!o.driverName || !o.driverName.trim()) unassignedDriverCount += 1;
    }

    return {
      totalCount: orders.length,
      toPrepareCount,
      shippingCount,
      deliveredCount,
      unbilledCount,
      unassignedDriverCount,
      totalVolume,
      knownDrivers: Array.from(driversSet).sort(),
    };
  }, [orders]);

  const effectiveOrderFilter = activeSection === "billing" ? "unbilled" : orderFilter;

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    const list = orders.filter((o) => {
      const matchQuery =
        !q ||
        (o.id || "").toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.customerPhone || "").toLowerCase().includes(q) ||
        (o.deliveryAddress || "").toLowerCase().includes(q) ||
        (o.deliveryZone || "").toLowerCase().includes(q) ||
        (o.driverName || "").toLowerCase().includes(q);
      const matchStatus =
        effectiveOrderFilter === "all"
          ? true
          : effectiveOrderFilter === "unbilled"
          ? !o.invoiceId && o.orderStatus !== "annulee"
          : effectiveOrderFilter === "pending_logistics"
          ? ["nouvelle", "confirmee", "en_preparation"].includes(o.orderStatus)
          : o.orderStatus === effectiveOrderFilter;
      const drv = (o.driverName || "").trim();
      const matchDriver =
        orderDriverFilter === "all"
          ? true
          : orderDriverFilter === "unassigned"
          ? drv.length === 0
          : drv === orderDriverFilter;
      const pay = o.paymentStatus === "paye" ? "paye" : "en_attente";
      const matchPayment =
        orderPaymentFilter === "all" ? true : pay === orderPaymentFilter;
      return matchQuery && matchStatus && matchDriver && matchPayment;
    });

    const sorted = [...list];
    if (orderSort === "amount_desc") {
      sorted.sort((a, b) => Number(b.totalAmount || 0) - Number(a.totalAmount || 0));
    } else if (orderSort === "amount_asc") {
      sorted.sort((a, b) => Number(a.totalAmount || 0) - Number(b.totalAmount || 0));
    }
    return sorted;
  }, [
    orders,
    orderSearch,
    effectiveOrderFilter,
    orderDriverFilter,
    orderPaymentFilter,
    orderSort,
  ]);

  const handleShareOrderStatusWhatsApp = (ord) => {
    const shopName = companyInfo?.name || "Notre Boutique";
    const statusLabel = ORDER_STATUS_META[ord.orderStatus]?.label || ord.orderStatus;
    const isPaid = ord.paymentStatus === "paye";
    const driverTxt = ord.driverName
      ? `\n🛵 *Livreur :* ${ord.driverName}`
      : "";
    const statusHint =
      ord.orderStatus === "expediee"
        ? "Votre colis est actuellement en route vers vous !"
        : ord.orderStatus === "livree"
        ? "Votre commande a été livrée avec succès. Merci pour votre confiance !"
        : ord.orderStatus === "en_preparation"
        ? "Votre commande est en cours d'emballage."
        : ord.orderStatus === "confirmee"
        ? "Votre commande est bien confirmée."
        : "Nous avons bien reçu votre commande.";

    const msg =
      `📦 *${shopName} — Suivi Commande ${ord.id}*\n` +
      `Bonjour *${ord.customerName}*,\n${statusHint}\n\n` +
      `📌 *Statut :* ${statusLabel}\n` +
      `📍 *Adresse / Zone :* ${ord.deliveryAddress || ord.deliveryZone}\n` +
      `💰 *Total :* ${formatAmount(ord.totalAmount, currSym)} (${
        isPaid ? "Déjà payée ✅" : `À régler : ${ord.paymentMethod}`
      })` +
      driverTxt;

    const cleanDigits = String(ord.customerPhone || "").replace(/\D/g, "");
    const baseWa = cleanDigits.length >= 8 ? `https://wa.me/${cleanDigits}` : "https://wa.me/";
    if (typeof window !== "undefined") {
      window.open(`${baseWa}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
    }
  };

  const handleExportOrdersExcel = () => {
    try {
      exportEcommerceOrdersToXLSX(
        filteredOrders,
        [],
        orderFilter === "all" ? "Commandes_Livraisons" : orderFilter,
        currSym,
        "Commandes_Livraisons_Ecommerce_FacturX.xlsx"
      );
      if (onToast) onToast("Liste des commandes exportée en Excel (.xlsx) !", "success");
    } catch (err) {
      if (onToast) onToast(err.message || "Erreur lors de l'export des commandes.", "error");
    }
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: "Général",
      price: "",
      promoPrice: "",
      costPrice: "",
      stock: "10",
      imageUrl: "",
      variants: [],
      description: "",
      isActive: true,
    });
    setNewVariantLabel("");
    setNewVariantStock("");
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || "",
      sku: prod.sku || "",
      category: prod.category || "Général",
      price: String(prod.price ?? ""),
      promoPrice: prod.promoPrice ? String(prod.promoPrice) : "",
      costPrice: prod.costPrice ? String(prod.costPrice) : "",
      stock: String(prod.stock ?? "0"),
      imageUrl: prod.imageUrl || "",
      variants: Array.isArray(prod.variants) ? prod.variants : [],
      description: prod.description || "",
      isActive: prod.isActive !== false,
    });
    setNewVariantLabel("");
    setNewVariantStock("");
    setIsProductModalOpen(true);
  };

  const handleDuplicateProduct = (prod) => {
    setEditingProduct(null);
    setProductForm({
      name: `${prod.name} (Copie)`,
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: prod.category || "Général",
      price: String(prod.price ?? ""),
      promoPrice: prod.promoPrice ? String(prod.promoPrice) : "",
      costPrice: prod.costPrice ? String(prod.costPrice) : "",
      stock: String(prod.stock ?? "0"),
      imageUrl: prod.imageUrl || "",
      variants: Array.isArray(prod.variants) ? prod.variants : [],
      description: prod.description || "",
      isActive: true,
    });
    setNewVariantLabel("");
    setNewVariantStock("");
    setIsProductModalOpen(true);
  };

  const handleAddVariant = () => {
    const lbl = newVariantLabel.trim();
    if (!lbl) return;
    const vStk = newVariantStock !== "" ? Math.max(0, Number(newVariantStock)) : 0;
    setProductForm((prev) => ({
      ...prev,
      variants: [
        ...(prev.variants || []),
        { id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, label: lbl, stock: vStk, price: null },
      ],
    }));
    setNewVariantLabel("");
    setNewVariantStock("");
  };

  const handleRemoveVariant = (varId) => {
    setProductForm((prev) => ({
      ...prev,
      variants: (prev.variants || []).filter((v) => v.id !== varId),
    }));
  };

  const handleShareProductWhatsApp = async (prod) => {
    const shopName = companyInfo?.name || "Notre Boutique";
    const shopPhone = companyInfo?.phone || companyInfo?.mobile || "";
    const basePrice = Number(prod.price || 0);
    const effPrice = getEffectiveProductPrice(prod);
    const hasPromo = effPrice < basePrice;
    const discountPct = hasPromo ? Math.round(((basePrice - effPrice) / basePrice) * 100) : 0;
    const variantsLine =
      Array.isArray(prod.variants) && prod.variants.length > 0
        ? `\n🎨 *Options / Variantes :* ${prod.variants.map((v) => v.label).join(", ")}`
        : "";
    const priceLine = hasPromo
      ? `🔥 *PROMO -${discountPct}% :* *${formatAmount(effPrice, currSym)}* (au lieu de ~${formatAmount(
          basePrice,
          currSym
        )}~)`
      : `💰 *Prix :* *${formatAmount(effPrice, currSym)}*`;

    const message =
      `🛍️ *${shopName}* — *${prod.name}*\n` +
      `${priceLine}\n` +
      (prod.sku ? `🏷️ Réf : ${prod.sku}\n` : "") +
      `📦 Disponibilité : ${Number(prod.stock || 0) > 0 ? `${prod.stock} en stock` : "Sur commande"}` +
      variantsLine +
      (prod.description ? `\n📝 ${prod.description}` : "") +
      `\n\n👉 *Pour commander rapidement :* répondez à ce message` +
      (shopPhone ? ` ou écrivez au ${shopPhone}` : "") +
      ` !`;

    // Sur mobile, partager aussi la photo si le navigateur le permet
    if (
      typeof navigator !== "undefined" &&
      navigator.share &&
      prod.imageUrl &&
      prod.imageUrl.startsWith("data:image/")
    ) {
      try {
        const res = await fetch(prod.imageUrl);
        const blob = await res.blob();
        const file = new File([blob], `${prod.sku || "produit"}.png`, { type: blob.type || "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: prod.name, text: message, files: [file] });
          return;
        }
      } catch {
        // Repli classique vers WhatsApp URL
      }
    }

    if (typeof window !== "undefined") {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    }
  };

  const handleShareFullCatalogWhatsApp = () => {
    const activeItems = filteredProducts.filter((p) => p.isActive !== false && Number(p.stock || 0) > 0);
    if (activeItems.length === 0) {
      if (onToast) onToast("Aucun produit actif en stock à partager.", "info");
      return;
    }
    const shopName = companyInfo?.name || "Notre Boutique";
    const shopPhone = companyInfo?.phone || companyInfo?.mobile || "";
    const lines = activeItems.slice(0, 15).map((p, idx) => {
      const base = Number(p.price || 0);
      const eff = getEffectiveProductPrice(p);
      const hasPromo = eff < base;
      const varTxt =
        Array.isArray(p.variants) && p.variants.length > 0
          ? ` [${p.variants.map((v) => v.label).join("/")}]`
          : "";
      return `${idx + 1}. *${p.name}*${varTxt} — ${
        hasPromo
          ? `*${formatAmount(eff, currSym)}* (Promo ~${formatAmount(base, currSym)}~)`
          : `*${formatAmount(eff, currSym)}*`
      }`;
    });
    const text =
      `🛍️ *CATALOGUE — ${shopName}*\n\n` +
      lines.join("\n") +
      `\n\n💬 Répondez avec le numéro du produit souhaité pour commander immédiatement !` +
      (shopPhone ? `\n📞 Service client : ${shopPhone}` : "");

    if (typeof window !== "undefined") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    }
  };

  const handleQuickStockDelta = async (prod, delta) => {
    if (!onUpdateProduct) return;
    const nextStock = Math.max(0, Number(prod.stock || 0) + delta);
    try {
      await onUpdateProduct(prod.id, { stock: nextStock });
      if (onToast) onToast(`Stock de "${prod.name}" ajusté à ${nextStock}.`, "success");
    } catch (err) {
      if (onToast) onToast(err.message || "Erreur ajustement stock.", "error");
    }
  };

  const handleToggleProductActive = async (prod) => {
    if (!onUpdateProduct) return;
    const nextActive = prod.isActive === false;
    try {
      await onUpdateProduct(prod.id, { isActive: nextActive });
      if (onToast) {
        onToast(
          nextActive
            ? `"${prod.name}" est maintenant actif à la vente.`
            : `"${prod.name}" mis en pause du catalogue.`,
          "info"
        );
      }
    } catch (err) {
      if (onToast) onToast(err.message || "Erreur mise à jour statut produit.", "error");
    }
  };

  const handleQuickOrderProduct = (prod) => {
    if (Number(prod.stock || 0) <= 0) {
      if (onToast) onToast(`"${prod.name}" est en rupture de stock.`, "error");
      return;
    }
    const firstVariant =
      Array.isArray(prod.variants) && prod.variants.length > 0 ? prod.variants[0].label : "";
    const effPrice = getEffectiveProductPrice(prod);
    setOrderCart([
      {
        productId: prod.id,
        variant: firstVariant,
        description: firstVariant ? `${prod.name} (${firstVariant})` : prod.name,
        quantity: 1,
        unitPrice: effPrice,
      },
    ]);
    setSelectedCartProductId(prod.id);
    setSelectedCartVariant(firstVariant);
    setSelectedCartQty("1");
    setIsOrderModalOpen(true);
  };

  const handleProductImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      if (onToast) onToast("Image trop lourde (max 1.5 Mo).", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProductForm((prev) => ({ ...prev, imageUrl: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportCatalogExcel = () => {
    try {
      exportEcommerceCatalogToXLSX(filteredProducts, currSym);
      if (onToast) onToast("Catalogue produits exporté en Excel (.xlsx) !", "success");
    } catch (err) {
      if (onToast) onToast(err.message || "Erreur lors de l'export du catalogue.", "error");
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: productForm.name.trim(),
        sku: productForm.sku.trim(),
        category: productForm.category.trim() || "Général",
        price: Number(productForm.price || 0),
        promoPrice: productForm.promoPrice ? Number(productForm.promoPrice) : null,
        costPrice: Number(productForm.costPrice || 0),
        stock: Number(productForm.stock || 0),
        imageUrl: productForm.imageUrl.trim(),
        variants: productForm.variants || [],
        description: productForm.description.trim(),
        isActive: productForm.isActive !== false,
      };
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, payload);
        if (onToast) onToast("Produit mis à jour dans le catalogue.", "success");
      } else {
        await onCreateProduct(payload);
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
    const existingForProd = orderCart
      .filter((i) => i.productId === prod.id)
      .reduce((s, i) => s + Number(i.quantity || 0), 0);
    const nextQtyTotal = existingForProd + qty;
    if (nextQtyTotal > availStock) {
      if (onToast) {
        onToast(
          `Stock insuffisant pour "${prod.name}" (disponible : ${availStock}, demandé : ${nextQtyTotal}).`,
          "error"
        );
      }
      return;
    }
    const chosenVar = selectedCartVariant || "";
    const itemDesc = chosenVar ? `${prod.name} (${chosenVar})` : prod.name;
    const effPrice = getEffectiveProductPrice(prod);

    setOrderCart((prev) => {
      const existing = prev.find(
        (i) => i.productId === prod.id && (i.variant || "") === chosenVar
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === prod.id && (i.variant || "") === chosenVar
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          variant: chosenVar,
          description: itemDesc,
          quantity: qty,
          unitPrice: effPrice,
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

  const handleExportDailyExcel = () => {
    try {
      const safeLabel = (selectedDate || selectedPeriod || "Aujourdhui").replace(/[/\s]+/g, "_");
      exportEcommerceOrdersToXLSX(
        periodOrders,
        metrics.topProducts,
        selectedDate || selectedPeriod,
        currSym,
        `Bilan_Ecommerce_${safeLabel}.xlsx`
      );
      if (onToast) onToast(`Bilan Excel (${selectedDate || selectedPeriod}) téléchargé !`, "success");
    } catch (err) {
      if (onToast) onToast(err.message || "Erreur lors de l'export Excel.", "error");
    }
  };

  const handleExportDailyPdf = () => {
    try {
      const rows = periodOrders.map((o) => {
        const st = ORDER_STATUS_META[o.orderStatus]?.label || o.orderStatus || "Nouvelle";
        const pay = o.paymentStatus === "paye" ? "Payee" : "Attente";
        return {
          id: o.id,
          clientName: o.customerName,
          contactPerson: `${o.customerPhone || ""} ${o.deliveryZone ? `(${o.deliveryZone})` : ""}`.trim(),
          dueDate: o.paymentMethod || "Cash",
          totalAmount: Number(o.totalAmount || 0),
          statusLabel: `${st} / ${pay}`,
        };
      });
      generateReportPdf({
        title: `BILAN E-COMMERCE — ${selectedDate || selectedPeriod}`,
        reportType: "all",
        companyInfo,
        userProfile: { name: userProfile?.fullName || "Commerçant" },
        data: rows,
        currency: currSym,
      });
      if (onToast) onToast(`Bilan PDF (${selectedDate || selectedPeriod}) généré !`, "success");
    } catch (err) {
      if (onToast) onToast(err.message || "Erreur lors de la génération PDF.", "error");
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
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {periodOrders.length === 0 && orders.length > 0 && (
                <button
                  type="button"
                  onClick={() => applyQuickPeriod("Toutes les dates")}
                  className="text-xs font-bold text-blue-600 hover:underline mr-1 cursor-pointer"
                >
                  {orders.length} cmd sur l&apos;historique →
                </button>
              )}
              <button
                type="button"
                onClick={handleExportDailyExcel}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Exporter le bilan de la période en Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Bilan Excel</span>
              </button>
              <button
                type="button"
                onClick={handleExportDailyPdf}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Télécharger le bilan de la période en PDF"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Bilan PDF</span>
              </button>
            </div>
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

            {/* GRAPHIQUE 2 (1/3) : Répartition Commandes (Reçues • En attente • En expédition • Livrées • Annulées) */}
            {(() => {
              const allDonutItems = [
                ...metrics.statusDonutData,
                {
                  key: "annulee",
                  label: "Annulées / Retours",
                  count: metrics.cancelledCount,
                  color: "#E11D48",
                },
              ];
              const totalStatusCount = Math.max(
                1,
                metrics.pendingLogisticsCount +
                  metrics.shippingCount +
                  metrics.deliveredCount +
                  metrics.cancelledCount
              );
              const radius = 56;
              const circ = 2 * Math.PI * radius;
              let accOffset = 0;

              const donutSegments = allDonutItems.map((seg) => {
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
                      Reçues, en attente, en expédition, livrées &amp; annulées ({selectedPeriod})
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
                        {metrics.totalOrders > 0 &&
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

                    {/* Suivi des Annulations / Retours livraison */}
                    <button
                      type="button"
                      onClick={() => {
                        setOrderFilter("annulee");
                        onChangeSection && onChangeSection("orders");
                      }}
                      className="w-full p-2.5 rounded-xl bg-[#FFE4E6]/45 hover:bg-[#FFE4E6]/75 border border-[#FECDD3] flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#BE123C] truncate">
                            Annulées / Retours
                          </p>
                          <p className="text-[10px] text-rose-700/80 truncate">
                            {formatAmount(metrics.cancelledAmount, currSym)} non réalisés
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-extrabold text-[#BE123C]">
                          {metrics.cancelledCount}
                        </span>
                        <span className="text-[10px] font-semibold text-rose-700/80 ml-1">
                          ({metrics.cancellationRate}%)
                        </span>
                      </div>
                    </button>
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

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {metrics.pipelineStages.map((stage) => {
                const share =
                  metrics.totalOrders > 0
                    ? Math.round((stage.count / metrics.totalOrders) * 100)
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

              {/* Top Produits Vendus (Best-sellers de la période) */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Top Produits Vendus
                    </h2>
                    <p className="text-xs text-slate-500">
                      Articles les plus performants ({selectedDate || selectedPeriod})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChangeSection && onChangeSection("products")}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Catalogue →
                  </button>
                </div>

                {metrics.topProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Aucune vente de produit enregistrée sur cette période.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {metrics.topProducts.map((tp, idx) => {
                      const topMax = metrics.topProducts[0]?.revenue || 1;
                      const pct = Math.max(8, Math.round((tp.revenue / topMax) * 100));
                      return (
                        <div
                          key={tp.key}
                          className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-100 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0 ${
                                  idx === 0
                                    ? "bg-[#183BB0] text-white"
                                    : "bg-blue-100 text-[#183BB0]"
                                }`}
                              >
                                #{idx + 1}
                              </span>
                              <span className="font-bold text-slate-900 truncate">{tp.name}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-extrabold text-slate-900">
                                {formatAmount(tp.revenue, currSym)}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500 ml-1.5">
                                • {tp.quantity} vendu(s)
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#183BB0] rounded-full"
                              style={{ width: `${pct}%` }}
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

            {/* Colonne Droite : Commandes Récentes & Facturation + Suivi Annulations / Retours */}
            <div className="space-y-6">
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

              {/* Carte dédiée : Suivi des Annulations & Retours Livraison */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Suivi des Annulations &amp; Retours livraison
                    </h2>
                    <p className="text-xs text-slate-500">
                      Commandes annulées, colis refusés et impact chiffre ({selectedDate || selectedPeriod})
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                      metrics.cancelledCount > 0
                        ? "bg-[#FFE4E6] text-[#BE123C] border-[#FECDD3]"
                        : "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]"
                    }`}
                  >
                    {metrics.cancellationRate}% annulation
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#FFE4E6]/45 border border-[#FECDD3]">
                    <p className="text-[11px] font-bold text-[#BE123C] uppercase">
                      Commandes annulées
                    </p>
                    <p className="text-lg font-extrabold text-[#BE123C] mt-0.5">
                      {metrics.cancelledCount}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">
                      Montant non réalisé
                    </p>
                    <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {formatAmount(metrics.cancelledAmount, currSym)}
                    </p>
                  </div>
                </div>

                {metrics.cancelledOrders.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Aucune commande annulée ni retour livraison sur cette période.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {metrics.cancelledOrders.slice(0, 4).map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 rounded-xl bg-[#FFE4E6]/35 border border-[#FECDD3] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            <span className="font-mono text-[#BE123C] mr-1.5">{ord.id}</span>
                            {ord.customerName}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {ord.deliveryZone} • {ord.paymentMethod}
                          </p>
                        </div>
                        <span className="font-extrabold text-[#BE123C] shrink-0">
                          {formatAmount(ord.totalAmount, currSym)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setOrderFilter("annulee");
                      onChangeSection && onChangeSection("orders");
                    }}
                    className="text-xs font-bold text-[#BE123C] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Gérer les annulations &amp; retours</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VUE CATALOGUE PRODUITS OPTIMISÉE (DESIGN SYSTEM B2B 1:1) */}
      {activeSection === "products" && (
        <div className="space-y-6">
          {/* 4 KPIs Catalogue Produits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div
              onClick={() => setProductStockFilter("all")}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {catalogStats.activeCount} actif(s)
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4">
                Produits au catalogue
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                {catalogStats.totalCount}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {catalogStats.categories.length} catégorie(s) • {catalogStats.pausedCount} en pause
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                  {catalogStats.totalStockUnits} unités
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4">
                Valeur totale du stock
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                {formatAmount(catalogStats.stockRetailValue, currSym)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {catalogStats.stockCostValue > 0
                  ? `Marge potentielle : ${formatAmount(catalogStats.potentialMargin, currSym)}`
                  : "Renseignez le prix d'achat pour suivre vos marges"}
              </p>
            </div>

            <div
              onClick={() =>
                setProductStockFilter((f) => (f === "low" ? "all" : "low"))
              }
              className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all cursor-pointer ${
                productStockFilter === "low"
                  ? "border-amber-400 ring-2 ring-amber-100"
                  : "border-slate-100"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                  Seuil ≤ 5
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4">
                Stock faible
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                {catalogStats.lowStockCount}
              </p>
              <p className="text-xs text-amber-700 font-semibold mt-2">
                Cliquez pour filtrer →
              </p>
            </div>

            <div
              onClick={() =>
                setProductStockFilter((f) => (f === "out" ? "all" : "out"))
              }
              className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all cursor-pointer ${
                productStockFilter === "out"
                  ? "border-rose-400 ring-2 ring-rose-100"
                  : "border-slate-100"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <X className="w-5 h-5" />
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    catalogStats.outOfStockCount > 0
                      ? "bg-[#FFE4E6] text-[#BE123C] border-[#FECDD3]"
                      : "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]"
                  }`}
                >
                  {catalogStats.outOfStockCount > 0 ? "Action requise" : "Aucune rupture"}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4">
                Ruptures de stock
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                {catalogStats.outOfStockCount}
              </p>
              <p className="text-xs text-rose-700 font-semibold mt-2">
                Cliquez pour réapprovisionner →
              </p>
            </div>
          </div>

          {/* Conteneur principal Catalogue (Recherche, Filtres, Vue Grille/Tableau, Export) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Recherche */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Rechercher par nom, SKU, catégorie, description..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Filtres & Bascule Grille/Tableau & Export */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="all">Toutes catégories ({catalogStats.categories.length})</option>
                  {catalogStats.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={productStockFilter}
                  onChange={(e) => setProductStockFilter(e.target.value)}
                  className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="all">Tous les stocks</option>
                  <option value="in_stock">En stock (&gt; 5)</option>
                  <option value="low">Stock faible (1–5)</option>
                  <option value="out">Rupture (0)</option>
                  <option value="paused">En pause / Masqués</option>
                </select>

                <select
                  value={productSort}
                  onChange={(e) => setProductSort(e.target.value)}
                  className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="recent">Plus récents</option>
                  <option value="stock_asc">Stock croissant</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                  <option value="name_asc">Nom (A → Z)</option>
                </select>

                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setProductViewMode("grid")}
                    className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                      productViewMode === "grid"
                        ? "bg-white text-blue-600 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Vue Grille"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductViewMode("table")}
                    className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                      productViewMode === "table"
                        ? "bg-white text-blue-600 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Vue Tableau"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleShareFullCatalogWhatsApp}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Partager le catalogue actif sur WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLabelModalProducts(filteredProducts)}
                  disabled={filteredProducts.length === 0}
                  className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="Imprimer les étiquettes Code-Barres / SKU"
                >
                  <Barcode className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Code-barres</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkImportOpen(true)}
                  className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Importer des produits en masse (Excel / CSV)"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Importer</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCatalogExcel}
                  className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Exporter le catalogue vers Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exporter</span>
                </button>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {products.length === 0
                    ? "Aucun produit dans votre catalogue E-Commerce. Cliquez sur « Ajouter un produit » ou importez un fichier Excel/CSV."
                    : "Aucun produit ne correspond à vos filtres actuels."}
                </p>
                {products.length === 0 ? (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={openNewProductModal}
                      className="px-4 py-2 rounded-xl bg-[#183BB0] text-white text-xs font-bold cursor-pointer"
                    >
                      + Ajouter mon premier produit
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBulkImportOpen(true)}
                      className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold cursor-pointer"
                    >
                      Importer Excel / CSV
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setProductSearch("");
                      setProductCategoryFilter("all");
                      setProductStockFilter("all");
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : productViewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((prod) => {
                  const stk = Number(prod.stock || 0);
                  const priceNum = Number(prod.price || 0);
                  const effPrice = getEffectiveProductPrice(prod);
                  const hasPromo = effPrice < priceNum;
                  const discountPct = hasPromo
                    ? Math.round(((priceNum - effPrice) / priceNum) * 100)
                    : 0;
                  const costNum = Number(prod.costPrice || 0);
                  const unitMargin = costNum > 0 ? effPrice - costNum : 0;
                  const marginPct =
                    costNum > 0 && effPrice > 0
                      ? Math.round(((effPrice - costNum) / effPrice) * 100)
                      : 0;
                  const soldQty =
                    catalogStats.soldByProduct[prod.id] ||
                    catalogStats.soldByProduct[prod.name] ||
                    0;
                  const isPaused = prod.isActive === false;
                  const variantsList = Array.isArray(prod.variants) ? prod.variants : [];

                  return (
                    <div
                      key={prod.id}
                      className={`p-4 rounded-2xl border bg-[#F8FAFC] hover:bg-white transition-all flex flex-col justify-between gap-3.5 ${
                        isPaused
                          ? "border-slate-200 opacity-75"
                          : stk <= 0
                          ? "border-[#FECDD3]"
                          : "border-slate-200/80 hover:border-blue-200"
                      }`}
                    >
                      {/* Haut de carte : Photo / Initiales + Titre + Badge Stock */}
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-3">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 text-[#183BB0] font-extrabold text-base flex items-center justify-center shrink-0">
                              {(prod.name || "PR").slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-[#183BB0] border border-blue-200">
                                  {prod.category || "Général"}
                                </span>
                                {hasPromo && (
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3]">
                                    -{discountPct}%
                                  </span>
                                )}
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                  isPaused
                                    ? "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]"
                                    : stk <= 0
                                    ? "bg-[#FFE4E6] text-[#BE123C] border-[#FECDD3]"
                                    : stk <= 5
                                    ? "bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]"
                                    : "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isPaused
                                      ? "bg-[#64748B]"
                                      : stk <= 0
                                      ? "bg-[#E11D48]"
                                      : stk <= 5
                                      ? "bg-[#EA580C]"
                                      : "bg-[#16A34A]"
                                  }`}
                                />
                                {isPaused
                                  ? "En pause"
                                  : stk <= 0
                                  ? "Rupture (0)"
                                  : `Stock : ${stk}`}
                              </span>
                            </div>

                            <h3 className="text-sm font-extrabold text-slate-900 mt-1.5 truncate">
                              {prod.name}
                            </h3>
                            <p className="text-[11px] font-mono text-slate-400 truncate">
                              {prod.sku ? `SKU : ${prod.sku}` : "Sans SKU"}
                              {soldQty > 0 ? ` • ${soldQty} vendu(s)` : ""}
                            </p>
                          </div>
                        </div>

                        {variantsList.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {variantsList.slice(0, 4).map((v) => (
                              <span
                                key={v.id || v.label}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700"
                              >
                                {v.label}
                                {v.stock > 0 ? ` (${v.stock})` : ""}
                              </span>
                            ))}
                            {variantsList.length > 4 && (
                              <span className="text-[10px] font-bold text-slate-400 px-1">
                                +{variantsList.length - 4}
                              </span>
                            )}
                          </div>
                        )}

                        {prod.description && (
                          <p className="text-xs text-slate-500 line-clamp-2">{prod.description}</p>
                        )}
                      </div>

                      {/* Prix, Prix barré, Marge & Ajustement rapide stock */}
                      <div className="space-y-3 pt-2 border-t border-slate-200/70">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-base font-extrabold text-[#183BB0]">
                                {formatAmount(effPrice, currSym)}
                              </span>
                              {hasPromo && (
                                <span className="text-xs font-semibold text-slate-400 line-through">
                                  {formatAmount(priceNum, currSym)}
                                </span>
                              )}
                            </div>
                            {costNum > 0 && (
                              <p className="text-[10px] font-semibold text-emerald-700">
                                Marge : +{formatAmount(unitMargin, currSym)} ({marginPct}%)
                              </p>
                            )}
                          </div>

                          {/* Ajustement stock rapide -1 / +1 / +10 */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQuickStockDelta(prod, -1)}
                              disabled={stk <= 0}
                              className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer disabled:opacity-40"
                              title="Retirer 1 du stock"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStockDelta(prod, 1)}
                              className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                              title="Ajouter 1 au stock"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStockDelta(prod, 10)}
                              className="px-2 h-7 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-[10px] font-extrabold text-blue-700 cursor-pointer"
                              title="Réapprovisionner +10"
                            >
                              +10
                            </button>
                          </div>
                        </div>

                        {/* Barre d'actions : Commander 1-clic, WhatsApp, Code-barres, Pause, Dupliquer, Modifier, Supprimer */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickOrderProduct(prod)}
                            disabled={stk <= 0 || isPaused}
                            className="flex-1 min-w-[110px] px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-45"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Commander</span>
                          </button>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleShareProductWhatsApp(prod)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                              title="Partager sur WhatsApp"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setLabelModalProducts([prod])}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                              title="Étiquette Code-Barres / SKU"
                            >
                              <Barcode className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleProductActive(prod)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                              title={isPaused ? "Réactiver la vente" : "Mettre en pause"}
                            >
                              {isPaused ? (
                                <PlayCircle className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <PauseCircle className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateProduct(prod)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                              title="Dupliquer"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditProductModal(prod)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {deletingProductId === prod.id ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (onDeleteProduct) await onDeleteProduct(prod.id);
                                  setDeletingProductId(null);
                                }}
                                className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Confirmer
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeletingProductId(prod.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* VUE TABLEAU STYLE B2B */
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-left border-collapse min-w-[740px]">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Produit &amp; Variantes</th>
                      <th className="py-3 px-4">Catégorie</th>
                      <th className="py-3 px-4 text-right">Prix / Promo</th>
                      <th className="py-3 px-4 text-right">Marge</th>
                      <th className="py-3 px-4 text-center">Stock</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredProducts.map((prod) => {
                      const stk = Number(prod.stock || 0);
                      const priceNum = Number(prod.price || 0);
                      const effPrice = getEffectiveProductPrice(prod);
                      const hasPromo = effPrice < priceNum;
                      const costNum = Number(prod.costPrice || 0);
                      const unitMargin = costNum > 0 ? effPrice - costNum : 0;
                      const isPaused = prod.isActive === false;
                      const variantsList = Array.isArray(prod.variants) ? prod.variants : [];
                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#183BB0] font-extrabold text-xs flex items-center justify-center shrink-0">
                                  {(prod.name || "PR").slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900">{prod.name}</p>
                                <p className="text-[11px] font-mono text-slate-400">
                                  {prod.sku || "—"}
                                  {variantsList.length > 0
                                    ? ` • ${variantsList.map((v) => v.label).join(", ")}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#183BB0] font-bold text-[10px] border border-blue-100">
                              {prod.category || "Général"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-extrabold text-slate-900 block">
                              {formatAmount(effPrice, currSym)}
                            </span>
                            {hasPromo && (
                              <span className="text-[10px] text-slate-400 line-through">
                                {formatAmount(priceNum, currSym)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                            {costNum > 0 ? `+${formatAmount(unitMargin, currSym)}` : "—"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuickStockDelta(prod, -1)}
                                disabled={stk <= 0}
                                className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center cursor-pointer disabled:opacity-40"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span
                                className={`font-extrabold px-2 py-0.5 rounded-full text-[11px] border ${
                                  isPaused
                                    ? "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]"
                                    : stk <= 0
                                    ? "bg-[#FFE4E6] text-[#BE123C] border-[#FECDD3]"
                                    : stk <= 5
                                    ? "bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]"
                                    : "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]"
                                }`}
                              >
                                {stk}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuickStockDelta(prod, 1)}
                                className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleQuickOrderProduct(prod)}
                                disabled={stk <= 0 || isPaused}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] cursor-pointer disabled:opacity-40"
                              >
                                Commander
                              </button>
                              <button
                                type="button"
                                onClick={() => handleShareProductWhatsApp(prod)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                                title="Partager WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setLabelModalProducts([prod])}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                title="Code-barres"
                              >
                                <Barcode className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditProductModal(prod)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteProduct && onDeleteProduct(prod.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VUE COMMANDES & LIVRAISONS OU GESTION DE FACTURATION */}
      {(activeSection === "orders" || activeSection === "billing") && (
        <div className="space-y-6">
          {/* 4 KPIs Logistiques dédiés sur Commandes & Livraisons */}
          {activeSection === "orders" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div
                onClick={() => setOrderFilter("all")}
                className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all cursor-pointer ${
                  orderFilter === "all" ? "border-blue-300 ring-2 ring-blue-50" : "border-slate-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {orderStats.unassignedDriverCount} sans livreur
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4">
                  Total Commandes
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                  {orderStats.totalCount}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Volume actif : {formatAmount(orderStats.totalVolume, currSym)}
                </p>
              </div>

              <div
                onClick={() =>
                  setOrderFilter((f) => (f === "pending_logistics" ? "all" : "pending_logistics"))
                }
                className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all cursor-pointer ${
                  orderFilter === "pending_logistics"
                    ? "border-amber-400 ring-2 ring-amber-100"
                    : "border-slate-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                    À préparer
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4">
                  En attente / Préparation
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                  {orderStats.toPrepareCount}
                </p>
                <p className="text-xs text-amber-700 font-semibold mt-2">
                  Cliquez pour préparer →
                </p>
              </div>

              <div
                onClick={() => setOrderFilter((f) => (f === "expediee" ? "all" : "expediee"))}
                className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all cursor-pointer ${
                  orderFilter === "expediee"
                    ? "border-blue-400 ring-2 ring-blue-100"
                    : "border-slate-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {orderStats.knownDrivers.length} livreur(s)
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4">
                  En cours de livraison
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                  {orderStats.shippingCount}
                </p>
                <p className="text-xs text-blue-600 font-semibold mt-2">
                  Suivre les colis en route →
                </p>
              </div>

              <div
                onClick={() => setOrderFilter((f) => (f === "livree" ? "all" : "livree"))}
                className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all cursor-pointer ${
                  orderFilter === "livree"
                    ? "border-emerald-400 ring-2 ring-emerald-100"
                    : "border-slate-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                    {orderStats.unbilledCount} à facturer
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4">
                  Commandes livrées
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                  {orderStats.deliveredCount}
                </p>
                <p className="text-xs text-emerald-700 font-semibold mt-2">
                  Prêtes pour facturation →
                </p>
              </div>
            </div>
          )}

          {/* Conteneur Principal Commandes / Facturation */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 space-y-4">
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
                  {orderStats.unbilledCount} commande(s) à facturer
                </span>
              </div>
            )}

            {/* Onglets pilules de statut rapides sur Commandes & Livraisons */}
            {activeSection === "orders" && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: "all", label: `Toutes (${orders.length})` },
                  { id: "pending_logistics", label: `À préparer (${orderStats.toPrepareCount})` },
                  { id: "nouvelle", label: "Nouvelles" },
                  { id: "confirmee", label: "Confirmées" },
                  { id: "en_preparation", label: "En préparation" },
                  { id: "expediee", label: `En livraison (${orderStats.shippingCount})` },
                  { id: "livree", label: `Livrées (${orderStats.deliveredCount})` },
                  { id: "unbilled", label: `À facturer (${orderStats.unbilledCount})` },
                  { id: "annulee", label: "Annulées" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setOrderFilter(pill.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      orderFilter === pill.id
                        ? "bg-[#183BB0] text-white border-[#183BB0] shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            )}

            {/* Barre Recherche & Filtres (Livreur, Paiement, Tri, Export Excel) */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Rechercher par N° commande, client, téléphone, zone, livreur..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={orderDriverFilter}
                  onChange={(e) => setOrderDriverFilter(e.target.value)}
                  className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="all">Tous les livreurs</option>
                  <option value="unassigned">
                    Sans livreur ({orderStats.unassignedDriverCount})
                  </option>
                  {orderStats.knownDrivers.map((drv) => (
                    <option key={drv} value={drv}>
                      Livreur : {drv}
                    </option>
                  ))}
                </select>

                <select
                  value={orderPaymentFilter}
                  onChange={(e) => setOrderPaymentFilter(e.target.value)}
                  className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="all">Tous paiements</option>
                  <option value="paye">Payées</option>
                  <option value="en_attente">Paiement en attente</option>
                </select>

                <select
                  value={orderSort}
                  onChange={(e) => setOrderSort(e.target.value)}
                  className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="recent">Plus récentes</option>
                  <option value="amount_desc">Montant décroissant</option>
                  <option value="amount_asc">Montant croissant</option>
                </select>

                <button
                  type="button"
                  onClick={handleExportOrdersExcel}
                  className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Exporter les commandes filtrées en Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exporter Excel</span>
                </button>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                  <Truck className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-500">
                  {activeSection === "billing"
                    ? "Toutes vos commandes actives ont déjà été facturées. Consultez le Registre Factures pour voir les documents émis."
                    : "Aucune commande trouvée pour ces filtres."}
                </p>
                {orders.length > 0 && activeSection !== "billing" && (
                  <button
                    type="button"
                    onClick={() => {
                      setOrderSearch("");
                      setOrderFilter("all");
                      setOrderDriverFilter("all");
                      setOrderPaymentFilter("all");
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((ord) => {
                  const st = ORDER_STATUS_META[ord.orderStatus] || ORDER_STATUS_META.nouvelle;
                  const linkedInvoice = ord.invoiceId
                    ? invoices.find((inv) => inv.id === ord.invoiceId)
                    : null;
                  const isPaid = ord.paymentStatus === "paye";
                  const nextStep = NEXT_ORDER_STEP[ord.orderStatus] || null;
                  const createdLabel = ord.createdAt
                    ? new Date(ord.createdAt).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";

                  return (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-[#F8FAFC] hover:bg-white transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-extrabold text-slate-900">
                              {ord.id}
                            </span>
                            {createdLabel && (
                              <span className="text-[11px] font-medium text-slate-400">
                                {createdLabel}
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${st.badge}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                isPaid
                                  ? "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]"
                                  : "bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]"
                              }`}
                            >
                              {isPaid ? "Payée" : "Paiement en attente"}
                            </span>
                            {ord.invoiceId && (
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Facture : {ord.invoiceId}
                              </span>
                            )}
                            {!ord.driverName && ord.orderStatus !== "annulee" && (
                              <button
                                type="button"
                                onClick={() => setEditingDeliveryOrder(ord)}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                              >
                                + Assigner livreur
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-slate-700">
                            <strong>{ord.customerName}</strong>
                            {ord.customerPhone ? (
                              <a
                                href={`tel:${ord.customerPhone}`}
                                className="text-blue-600 hover:underline font-semibold ml-1.5"
                              >
                                • {ord.customerPhone}
                              </a>
                            ) : null}
                            {ord.deliveryAddress ? ` • ${ord.deliveryAddress}` : ""}
                          </p>

                          {Array.isArray(ord.items) && ord.items.length > 0 && (
                            <p className="text-[11px] text-slate-500">
                              <strong className="text-slate-700">Articles :</strong>{" "}
                              {ord.items
                                .map((it) => `${it.quantity}× ${it.description}`)
                                .join(", ")}
                            </p>
                          )}

                          {ord.notes && (
                            <p className="text-[11px] text-amber-800 bg-amber-50/70 px-2.5 py-1 rounded-lg border border-amber-100 inline-block">
                              Note : {ord.notes}
                            </p>
                          )}
                        </div>

                        <div className="text-left sm:text-right shrink-0 space-y-0.5">
                          <p className="text-base font-extrabold text-slate-900">
                            {formatAmount(ord.totalAmount, currSym)}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {ord.paymentMethod} • Zone : <strong>{ord.deliveryZone}</strong>
                          </p>
                          {Number(ord.deliveryFee || 0) > 0 && (
                            <p className="text-[10px] text-slate-400">
                              dont livraison : {formatAmount(ord.deliveryFee, currSym)}
                            </p>
                          )}
                          {ord.driverName && (
                            <p className="text-[11px] font-bold text-[#183BB0] inline-flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              <span>Livreur : {ord.driverName}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/70">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {nextStep && (
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateOrderStatus &&
                                onUpdateOrderStatus(ord.id, nextStep.nextStatus)
                              }
                              className="px-3 py-1.5 rounded-xl bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <span>{nextStep.buttonLabel}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          <select
                            value={ord.orderStatus}
                            onChange={(e) =>
                              onUpdateOrderStatus && onUpdateOrderStatus(ord.id, e.target.value)
                            }
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700"
                          >
                            {Object.entries(ORDER_STATUS_META).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v.label}
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

                          <button
                            type="button"
                            onClick={() => setEditingDeliveryOrder(ord)}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                            title="Assigner livreur / Modifier livraison"
                          >
                            <Truck className="w-3.5 h-3.5 text-blue-600" />
                            <span className="hidden sm:inline">Livraison</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSlipOrder(ord)}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                            title="Bon de Livraison imprimable"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                            <span className="hidden sm:inline">Bon</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShareOrderStatusWhatsApp(ord)}
                            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 cursor-pointer"
                            title="Envoyer suivi WhatsApp au client"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {onDeleteOrder && (
                            deletingOrderId === ord.id ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteOrder(ord.id);
                                  setDeletingOrderId(null);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                              >
                                Confirmer suppr.
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeletingOrderId(ord.id)}
                                className="p-1.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Supprimer cette commande"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
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
                                    : "Générer Facture"}
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
        </div>
      )}

      {/* MODALE PRODUIT (Mobile-First) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92dvh] flex flex-col border border-slate-100 shadow-2xl overflow-hidden">
            <div className="shrink-0 px-5 py-4 bg-gradient-to-r from-[#1A44B8] to-[#183BB0] text-white flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-extrabold">
                {editingProduct ? "Modifier le Produit" : "Ajouter un Produit E-Commerce"}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-lg text-blue-100 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-3.5 text-xs">
                {/* Photo du produit (optionnelle) */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  {productForm.imageUrl ? (
                    <img
                      src={productForm.imageUrl}
                      alt="Aperçu produit"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white border border-dashed border-slate-300 text-slate-400 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Choisir photo</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleProductImageUpload}
                          className="hidden"
                        />
                      </label>
                      {productForm.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, imageUrl: "" })}
                          className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      PNG, JPG ou WebP (max 1.5 Mo) • Optionnel
                    </p>
                  </div>
                </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      placeholder="Ex: Mode, Électronique..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                </div>

                {/* Suggestions rapides de catégories */}
                <div className="flex flex-wrap gap-1.5">
                  {["Général", "Mode", "Électronique", "Beauté", "Maison", "Alimentation"].map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setProductForm({ ...productForm, category: cat })}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer ${
                          productForm.category === cat
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Prix normal ({currSym}) *
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
                    <label className="block font-bold text-rose-700 mb-1">
                      Prix promo ({currSym})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={productForm.promoPrice}
                      onChange={(e) =>
                        setProductForm({ ...productForm, promoPrice: e.target.value })
                      }
                      placeholder="Prix barré"
                      className="w-full px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50/40 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Prix achat ({currSym})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={productForm.costPrice}
                      onChange={(e) =>
                        setProductForm({ ...productForm, costPrice: e.target.value })
                      }
                      placeholder="Optionnel"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Stock *</label>
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

                {Number(productForm.promoPrice || 0) > 0 &&
                  Number(productForm.price || 0) > Number(productForm.promoPrice || 0) && (
                    <div className="p-2.5 rounded-xl bg-[#FFE4E6]/60 border border-[#FECDD3] flex items-center justify-between text-[11px] text-[#BE123C] font-bold">
                      <span>Promotion active (prix normal barré sur la fiche) :</span>
                      <span>
                        -
                        {Math.round(
                          ((Number(productForm.price) - Number(productForm.promoPrice)) /
                            Number(productForm.price)) *
                            100
                        )}
                        % de remise
                      </span>
                    </div>
                  )}

                {(() => {
                  const baseP = Number(productForm.price || 0);
                  const promoP = Number(productForm.promoPrice || 0);
                  const effP = promoP > 0 && promoP < baseP ? promoP : baseP;
                  const costP = Number(productForm.costPrice || 0);
                  if (effP <= 0 || costP <= 0) return null;
                  return (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-[11px] text-emerald-800 font-bold">
                      <span>Marge unitaire estimée :</span>
                      <span>
                        +{formatAmount(effP - costP, currSym)} (
                        {Math.round(((effP - costP) / effP) * 100)}%)
                      </span>
                    </div>
                  );
                })()}

                {/* Variantes produits (Tailles, Couleurs, Modèles) */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                      <span>Variantes (Tailles, Couleurs, Modèles)</span>
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {(productForm.variants || []).length} variante(s)
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newVariantLabel}
                      onChange={(e) => setNewVariantLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddVariant();
                        }
                      }}
                      placeholder="Ex: Taille M - Noir, 42 Blanc..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                    <input
                      type="number"
                      min="0"
                      value={newVariantStock}
                      onChange={(e) => setNewVariantStock(e.target.value)}
                      placeholder="Qté"
                      className="w-16 px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-center font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {(productForm.variants || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(productForm.variants || []).map((v) => (
                        <span
                          key={v.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-700"
                        >
                          <span>
                            {v.label}
                            {v.stock > 0 ? ` (${v.stock})` : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(v.id)}
                            className="text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({ ...productForm, description: e.target.value })
                    }
                    placeholder="Couleurs, tailles, caractéristiques..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isActive !== false}
                    onChange={(e) =>
                      setProductForm({ ...productForm, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                  />
                  <span className="font-bold text-slate-700">
                    Produit actif et disponible à la vente
                  </span>
                </label>
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
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
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
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={selectedCartProductId}
                          onChange={(e) => {
                            const pid = e.target.value;
                            setSelectedCartProductId(pid);
                            const found = products.find((p) => p.id === pid);
                            const firstVar =
                              found && Array.isArray(found.variants) && found.variants.length > 0
                                ? found.variants[0].label
                                : "";
                            setSelectedCartVariant(firstVar);
                          }}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                        >
                          <option value="">-- Choisir un produit --</option>
                          {products.map((p) => {
                            const stk = Number(p.stock || 0);
                            const isPaused = p.isActive === false;
                            const eff = getEffectiveProductPrice(p);
                            return (
                              <option key={p.id} value={p.id} disabled={stk <= 0 || isPaused}>
                                {p.name} ({formatAmount(eff, currSym)} •{" "}
                                {isPaused
                                  ? "En pause"
                                  : stk <= 0
                                  ? "Rupture de stock"
                                  : `Stock: ${stk}`})
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

                      {(() => {
                        const chosenProd = products.find((p) => p.id === selectedCartProductId);
                        if (!chosenProd || !Array.isArray(chosenProd.variants) || chosenProd.variants.length === 0) {
                          return null;
                        }
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-600 shrink-0">
                              Variante :
                            </span>
                            <select
                              value={selectedCartVariant}
                              onChange={(e) => setSelectedCartVariant(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-xs"
                            >
                              {chosenProd.variants.map((v) => (
                                <option key={v.id || v.label} value={v.label}>
                                  {v.label} {v.stock > 0 ? `(Dispo: ${v.stock})` : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {orderCart.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      {orderCart.map((item) => (
                        <div
                          key={`${item.productId}-${item.variant || ""}`}
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
                                  prev.filter(
                                    (i) =>
                                      !(
                                        i.productId === item.productId &&
                                        (i.variant || "") === (item.variant || "")
                                      )
                                  )
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

      {/* MODALE ÉTIQUETTES CODE-BARRES / SKU */}
      <BarcodeLabelModal
        isOpen={Array.isArray(labelModalProducts)}
        onClose={() => setLabelModalProducts(null)}
        products={labelModalProducts || []}
        companyName={companyInfo?.name || "Ma Boutique"}
        currSym={currSym}
      />

      {/* MODALE IMPORT EN MASSE EXCEL / CSV */}
      <BulkCatalogImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        currSym={currSym}
        onImportProducts={onCreateProductsBulk}
        onToast={onToast}
      />

      {/* MODALE ASSIGNATION LIVREUR & ÉDITION LIVRAISON */}
      <EditOrderDeliveryModal
        order={editingDeliveryOrder}
        onClose={() => setEditingDeliveryOrder(null)}
        onSave={onUpdateOrder}
        knownDrivers={orderStats.knownDrivers}
        currSym={currSym}
      />

      {/* MODALE BON DE LIVRAISON IMPRIMABLE */}
      <DeliverySlipModal
        order={slipOrder}
        onClose={() => setSlipOrder(null)}
        companyInfo={companyInfo}
        currSym={currSym}
        onShareWhatsApp={handleShareOrderStatusWhatsApp}
      />
    </div>
  );
}

