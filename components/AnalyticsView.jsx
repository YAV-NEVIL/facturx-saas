"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Send,
  Calendar,
  Wallet,
  CheckCircle2,
  Plus,
  Users,
  Building2,
  FileText,
  Sparkles,
  Zap,
  Info,
  Download,
  Filter,
  Search,
  Receipt,
  PieChart,
  BarChart3,
  CreditCard,
  MessageCircle,
  Phone,
  Layers,
  ChevronRight,
  ChevronDown,
  Target,
  FileSpreadsheet,
  Check,
  Percent,
  Play,
  Pause,
  Sliders,
  DollarSign,
  Maximize2,
  RefreshCw,
  Mail,
  X,
  ExternalLink,
} from "lucide-react";
import {
  formatFCFA,
  formatAmount,
  calculateInvoiceTotals,
  getCurrencySymbol,
} from "@/lib/mock-data";
import { exportAnalyticsToXLSX } from "@/lib/export-utils";

export default function AnalyticsView({
  invoices = [],
  payments = [],
  quotes = [],
  clients = [],
  companyInfo = {},
  onOpenInvoice,
  onOpenClientProfile,
  onOpenReminder,
  onOpenCreateInvoice,
  onNavigateToTab,
  onToast,
}) {
  // Période d'analyse sélectionnée
  const [selectedPeriod, setSelectedPeriod] = useState("octobre_2026");
  // Filtre d'état pour le tableau détaillé en bas
  const [tableFilter, setTableFilter] = useState("all");
  // Recherche textuelle dans le tableau
  const [tableSearch, setTableSearch] = useState("");
  // Tri du tableau (colonne + direction)
  const [sortColumn, setSortColumn] = useState("issueDate");
  const [sortDirection, setSortDirection] = useState("desc");
  // Métrique active sur le graphique d'évolution ("both" | "billed" | "paid")
  const [activeCurveMetric, setActiveCurveMetric] = useState("both");
  // Point du graphique survolé (index ou null)
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  // Segment du Donut survolé (null | 'payee' | 'envoyee' | 'en_attente' | 'brouillon')
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState(null);
  // Vue temporelle du graphique : "monthly" (6 mois) ou "weekly" (4 semaines d'Octobre)
  const [timelineMode, setTimelineMode] = useState("monthly");

  // --- MOTEUR DE VAGUES DYNAMIQUES & INTERACTIVES ---
  // Animation permanente en boucle des vagues (respiration fluide)
  const [waveTime, setWaveTime] = useState(0);
  const [isWaveActive, setIsWaveActive] = useState(true);
  const [waveIntensity, setWaveIntensity] = useState("normal"); // "gentle" | "normal" | "pulse"
  // Position interactive du curseur sur le SVG (coordonnées normalisées)
  const [mouseCoords, setMouseCoords] = useState({ x: null, y: null, active: false });
  const chartSvgRef = useRef(null);

  // --- ÉTAT DU SIMULATEUR DÉCISIONNEL DE TRÉSORERIE ---
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simRecoveryGain, setSimRecoveryGain] = useState(25); // Gain de recouvrement ciblé en % (+25%)
  const [simDsoReduction, setSimDsoReduction] = useState(4); // Jours de délai moyen à gagner (-4j)

  // --- MODALE DE RELANCE EXPRESS DYNAMIQUE (ACTION 1-CLIC) ---
  const [reminderModalInvoice, setReminderModalInvoice] = useState(null);
  const [reminderChannel, setReminderChannel] = useState("whatsapp");
  const [isReminderSent, setIsReminderSent] = useState(false);

  const currencySymbol = companyInfo?.currencySymbol || getCurrencySymbol(companyInfo?.defaultCurrency);

  // Boucle d'animation fluide des vagues via requestAnimationFrame
  useEffect(() => {
    let animId;
    let lastTimestamp = performance.now();

    const speedMultiplier = waveIntensity === "pulse" ? 0.05 : waveIntensity === "gentle" ? 0.018 : 0.03;

    const loop = (timestamp) => {
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      if (isWaveActive) {
        setWaveTime((prev) => (prev + (delta * speedMultiplier * 0.06)) % (Math.PI * 200));
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isWaveActive, waveIntensity]);

  // 1. CALCULS CONSOLIDÉS DU PORTEFEUILLE RÉEL
  const analyticsData = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let totalDraft = 0;

    let countBilled = invoices.length;
    let countPaid = 0;
    let countPending = 0;
    let countOverdue = 0;
    let countDraft = 0;

    // Agrégat par client pour identifier les Meilleurs Payeurs vs Clients en Retard
    const clientStatsMap = {};

    invoices.forEach((inv) => {
      const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
      totalBilled += total;

      const cName = inv.clientName || "Client Inconnu";
      if (!clientStatsMap[cName]) {
        clientStatsMap[cName] = {
          clientName: cName,
          contactPerson: inv.contactPerson,
          email: inv.clientEmail,
          phone: inv.clientPhone,
          location: inv.location,
          totalBilled: 0,
          totalPaid: 0,
          totalOverdue: 0,
          totalPending: 0,
          invoicesCount: 0,
          paidInvoicesCount: 0,
          overdueInvoicesCount: 0,
          invoicesList: [],
        };
      }

      clientStatsMap[cName].totalBilled += total;
      clientStatsMap[cName].invoicesCount += 1;
      clientStatsMap[cName].invoicesList.push(inv);

      if (inv.status === "payee") {
        totalPaid += total;
        countPaid += 1;
        clientStatsMap[cName].totalPaid += total;
        clientStatsMap[cName].paidInvoicesCount += 1;
      } else if (inv.status === "en_attente") {
        totalOverdue += total;
        countOverdue += 1;
        clientStatsMap[cName].totalOverdue += total;
        clientStatsMap[cName].overdueInvoicesCount += 1;
      } else if (inv.status === "envoyee") {
        totalPending += total;
        countPending += 1;
        clientStatsMap[cName].totalPending += total;
      } else if (inv.status === "brouillon") {
        totalDraft += total;
        countDraft += 1;
      }
    });

    const safeTotalBilled = totalBilled > 0 ? totalBilled : 1;
    const recoveryRate = Math.round((totalPaid / safeTotalBilled) * 100);
    const overdueRate = Math.round((totalOverdue / safeTotalBilled) * 100);
    const pendingRate = Math.round((totalPending / safeTotalBilled) * 100);
    const draftRate = Math.max(0, 100 - recoveryRate - overdueRate - pendingRate);

    // Détermination des Meilleurs Payeurs (classés par montant payé décroissant)
    const topPayers = Object.values(clientStatsMap)
      .filter((c) => c.totalPaid > 0)
      .sort((a, b) => b.totalPaid - a.totalPaid);

    // Détermination des Clients à Risque / En Retard (classés par montant en retard décroissant)
    const overdueClients = Object.values(clientStatsMap)
      .filter((c) => c.totalOverdue > 0 || c.overdueInvoicesCount > 0)
      .sort((a, b) => b.totalOverdue - a.totalOverdue);

    // Conversion Devis -> Factures
    let totalQuotesVolume = 0;
    let acceptedQuotesVolume = 0;
    quotes.forEach((q) => {
      const { total } = calculateInvoiceTotals(q.items, q.vatRate);
      totalQuotesVolume += total;
      if (q.status === "accepte" || q.status === "facture") {
        acceptedQuotesVolume += total;
      }
    });
    const quoteConversionRate =
      totalQuotesVolume > 0
        ? Math.round((acceptedQuotesVolume / totalQuotesVolume) * 100)
        : 68;

    return {
      totalBilled,
      totalPaid,
      totalPending,
      totalOverdue,
      totalDraft,
      countBilled,
      countPaid,
      countPending,
      countOverdue,
      countDraft,
      recoveryRate,
      overdueRate,
      pendingRate,
      draftRate,
      topPayers,
      overdueClients,
      totalQuotesVolume,
      acceptedQuotesVolume,
      quoteConversionRate,
    };
  }, [invoices, quotes]);

  // Données de la série temporelle connectées aux factures réelles
  const timelineSeries = useMemo(() => {
    if (timelineMode === "weekly") {
      const weeks = [
        { label: "Semaine 40 (01-07 Oct)", start: 1, end: 7, billed: 0, paid: 0 },
        { label: "Semaine 41 (08-14 Oct)", start: 8, end: 14, billed: 0, paid: 0 },
        { label: "Semaine 42 (15-21 Oct)", start: 15, end: 21, billed: 0, paid: 0 },
        { label: "Semaine 43 (22-28 Oct)", start: 22, end: 28, billed: 0, paid: 0 },
      ];

      invoices.forEach((inv) => {
        if (!inv.issueDate) return;
        const pts = inv.issueDate.split("/");
        if (pts.length === 3) {
          const day = parseInt(pts[0], 10);
          const month = parseInt(pts[1], 10);
          if (month === 10) {
            const w = weeks.find((w) => day >= w.start && day <= w.end) || weeks[3];
            const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
            w.billed += total;
            if (inv.status === "payee") {
              w.paid += total;
            }
          }
        }
      });

      return weeks.map((w) => {
        const gap = Math.max(0, w.billed - w.paid);
        const rate = w.billed > 0 ? Math.round((w.paid / w.billed) * 100) : 100;
        return { label: w.label, billed: w.billed, paid: w.paid, gap, rate };
      });
    }

    // Mode mensuel agrégé en direct (Mai à Octobre 2026)
    const months = [
      { label: "Mai 2026", month: 5, billed: 0, paid: 0 },
      { label: "Juin 2026", month: 6, billed: 0, paid: 0 },
      { label: "Juil 2026", month: 7, billed: 0, paid: 0 },
      { label: "Août 2026", month: 8, billed: 0, paid: 0 },
      { label: "Sept 2026", month: 9, billed: 0, paid: 0 },
      { label: "Oct 2026 (En cours)", month: 10, billed: 0, paid: 0 },
    ];

    invoices.forEach((inv) => {
      const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
      let m = 10;
      if (inv.issueDate) {
        const pts = inv.issueDate.split("/");
        if (pts.length === 3) {
          m = parseInt(pts[1], 10);
        }
      }
      const targetM = months.find((mo) => mo.month === m) || months[5];
      targetM.billed += total;
      if (inv.status === "payee") {
        targetM.paid += total;
      }
    });

    return months.map((mo) => {
      const gap = Math.max(0, mo.billed - mo.paid);
      const rate = mo.billed > 0 ? Math.round((mo.paid / mo.billed) * 100) : 0;
      return { ...mo, gap, rate };
    });
  }, [timelineMode, invoices]);

  // --- GÉNÉRATION DYNAMIQUE DES VAGUES SVG FLUIDES & RÉACTIVES AU CURSEUR ---
  const dynamicWaveData = useMemo(() => {
    const width = 640;
    const height = 240;
    const padding = { top: 25, right: 30, bottom: 35, left: 20 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const maxVal = Math.max(
      ...timelineSeries.map((d) => Math.max(d.billed, d.paid)),
      10000000
    ) * 1.15;

    // Amplitude de base de l'ondulation
    const baseAmp = waveIntensity === "pulse" ? 8 : waveIntensity === "gentle" ? 3.5 : 5.5;

    // Fonction d'échantillonnage haute résolution (32 points d'interpolation)
    // Permet une onde parfaitement continue et des déformations liquides au passage de la souris !
    const sampleCount = 32;

    const generateWavePoints = (metricKey, phaseShift = 0, color = "#2563EB") => {
      const points = [];
      for (let s = 0; s <= sampleCount; s++) {
        const progress = s / sampleCount;
        const x = padding.left + progress * innerWidth;

        // Déterminer la valeur interpolée le long de la série réelle
        const seriesIndex = progress * (timelineSeries.length - 1);
        const i0 = Math.floor(seriesIndex);
        const i1 = Math.min(timelineSeries.length - 1, Math.ceil(seriesIndex));
        const fraction = seriesIndex - i0;

        const val0 = timelineSeries[i0][metricKey];
        const val1 = timelineSeries[i1][metricKey];
        const interpolatedVal = val0 + (val1 - val0) * fraction;

        let baseY = padding.top + innerHeight - (interpolatedVal / maxVal) * innerHeight;

        // 1. Ondulation vivante perpétuelle (vague sinusoïdale continue)
        const waveAngle = waveTime * 1.6 + progress * Math.PI * 4 + phaseShift;
        const waveOffset = Math.sin(waveAngle) * baseAmp + Math.cos(waveAngle * 0.7) * (baseAmp * 0.4);

        // 2. Déformation physique réactive au curseur de l'utilisateur !
        // "Peu importe là où que la personne va mettre son curseur, les vagues doivent bouger"
        let cursorRipple = 0;
        if (mouseCoords.active && mouseCoords.x !== null) {
          const distToCursor = Math.abs(x - mouseCoords.x);
          const influenceRadius = 110; // Rayon d'action du curseur
          if (distToCursor < influenceRadius) {
            const normalizedDist = distToCursor / influenceRadius;
            // Gaussienne de répulsion et onde de choc liquide
            const bellCurve = Math.exp(-Math.pow(normalizedDist * 2.2, 2));
            const waveOscillation = Math.sin(distToCursor * 0.08 - waveTime * 3.5);
            cursorRipple = bellCurve * waveOscillation * 16;
          }
        }

        const finalY = Math.max(padding.top + 4, Math.min(padding.top + innerHeight - 2, baseY + waveOffset + cursorRipple));
        points.push({ x, y: finalY, val: interpolatedVal });
      }
      return points;
    };

    const pointsBilledWave = generateWavePoints("billed", 0, "#2563EB");
    const pointsPaidWave = generateWavePoints("paid", Math.PI * 0.7, "#16A34A");
    // Vague d'écho / couche d'ambiance volumétrique
    const pointsEchoWave = generateWavePoints("billed", Math.PI * 1.3, "#3B82F6");

    // Lissage des points en chemin Bézier cubique
    const buildPath = (pts) => {
      if (pts.length === 0) return "";
      let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? 0 : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }
      return d;
    };

    const pathBilled = buildPath(pointsBilledWave);
    const pathPaid = buildPath(pointsPaidWave);
    const pathEcho = buildPath(pointsEchoWave);

    const bottomY = padding.top + innerHeight;
    const areaBilled = `${pathBilled} L ${pointsBilledWave[pointsBilledWave.length - 1].x.toFixed(1)} ${bottomY} L ${pointsBilledWave[0].x.toFixed(1)} ${bottomY} Z`;
    const areaPaid = `${pathPaid} L ${pointsPaidWave[pointsPaidWave.length - 1].x.toFixed(1)} ${bottomY} L ${pointsPaidWave[0].x.toFixed(1)} ${bottomY} Z`;

    // Repères des points discrets pour les étiquettes et clics
    const keyPointsBilled = timelineSeries.map((d, i) => {
      const progress = i / (timelineSeries.length - 1);
      const x = padding.left + progress * innerWidth;
      const waveAngle = waveTime * 1.6 + progress * Math.PI * 4;
      const waveOffset = Math.sin(waveAngle) * baseAmp;
      const y = padding.top + innerHeight - (d.billed / maxVal) * innerHeight + waveOffset;
      return { x, y, ...d };
    });

    const keyPointsPaid = timelineSeries.map((d, i) => {
      const progress = i / (timelineSeries.length - 1);
      const x = padding.left + progress * innerWidth;
      const waveAngle = waveTime * 1.6 + progress * Math.PI * 4 + Math.PI * 0.7;
      const waveOffset = Math.sin(waveAngle) * baseAmp;
      const y = padding.top + innerHeight - (d.paid / maxVal) * innerHeight + waveOffset;
      return { x, y, ...d };
    });

    // Valeur calculée en temps réel au curseur
    let cursorValBilled = null;
    let cursorValPaid = null;
    if (mouseCoords.active && mouseCoords.x !== null) {
      const clampedX = Math.max(padding.left, Math.min(padding.left + innerWidth, mouseCoords.x));
      const prog = (clampedX - padding.left) / innerWidth;
      const sIdx = prog * (timelineSeries.length - 1);
      const i0 = Math.floor(sIdx);
      const i1 = Math.min(timelineSeries.length - 1, Math.ceil(sIdx));
      const frac = sIdx - i0;
      cursorValBilled = Math.round(timelineSeries[i0].billed + (timelineSeries[i1].billed - timelineSeries[i0].billed) * frac);
      cursorValPaid = Math.round(timelineSeries[i0].paid + (timelineSeries[i1].paid - timelineSeries[i0].paid) * frac);
    }

    return {
      width,
      height,
      padding,
      innerWidth,
      innerHeight,
      pathBilled,
      pathPaid,
      pathEcho,
      areaBilled,
      areaPaid,
      keyPointsBilled,
      keyPointsPaid,
      cursorValBilled,
      cursorValPaid,
    };
  }, [timelineSeries, waveTime, waveIntensity, mouseCoords]);

  // Données pour le Donut Chart interactif
  const donutData = useMemo(() => {
    const segments = [
      {
        id: "payee",
        label: "Factures Payées",
        count: analyticsData.countPaid,
        amount: analyticsData.totalPaid,
        percent: analyticsData.recoveryRate,
        color: "#16A34A", // vert
        bgClass: "bg-emerald-500",
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      {
        id: "envoyee",
        label: "En attente (Délais respectés)",
        count: analyticsData.countPending,
        amount: analyticsData.totalPending,
        percent: analyticsData.pendingRate,
        color: "#F59E0B", // orange
        bgClass: "bg-amber-500",
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      },
      {
        id: "en_attente",
        label: "En retard critique (Impayés)",
        count: analyticsData.countOverdue,
        amount: analyticsData.totalOverdue,
        percent: analyticsData.overdueRate,
        color: "#E11D48", // rose vif / rouge
        bgClass: "bg-rose-500",
        badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
      },
      {
        id: "brouillon",
        label: "Brouillons non émis",
        count: analyticsData.countDraft,
        amount: analyticsData.totalDraft,
        percent: analyticsData.draftRate,
        color: "#94A3B8", // ardoise
        bgClass: "bg-slate-400",
        badgeBg: "bg-slate-50 text-slate-700 border-slate-200",
      },
    ];

    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    const renderedSegments = segments.map((seg) => {
      const strokeLength = (seg.percent / 100) * circumference;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += strokeLength;
      return {
        ...seg,
        strokeLength,
        strokeDashoffset,
        circumference,
      };
    });

    return { segments: renderedSegments, circumference, radius };
  }, [analyticsData]);

  // Filtrage & Tri dynamique du tableau détaillé
  const filteredAndSortedInvoices = useMemo(() => {
    let result = invoices.filter((inv) => {
      if (tableFilter === "payee" && inv.status !== "payee") return false;
      if (tableFilter === "overdue" && inv.status !== "en_attente") return false;
      if (tableFilter === "pending" && inv.status !== "envoyee") return false;

      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase();
        const matchName = (inv.clientName || "").toLowerCase().includes(q);
        const matchId = (inv.id || "").toLowerCase().includes(q);
        const matchLoc = (inv.location || "").toLowerCase().includes(q);
        return matchName || matchId || matchLoc;
      }
      return true;
    });

    result.sort((a, b) => {
      let valA, valB;
      if (sortColumn === "total") {
        valA = calculateInvoiceTotals(a.items, a.vatRate).total;
        valB = calculateInvoiceTotals(b.items, b.vatRate).total;
      } else if (sortColumn === "client") {
        valA = a.clientName || "";
        valB = b.clientName || "";
      } else if (sortColumn === "status") {
        valA = a.status || "";
        valB = b.status || "";
      } else {
        valA = a.issueDate || "";
        valB = b.issueDate || "";
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [invoices, tableFilter, tableSearch, sortColumn, sortDirection]);

  // Gestion du tri par colonne
  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDirection("desc");
    }
  };

  // Gestion du mouvement de la souris sur le SVG
  const handleSvgMouseMove = (e) => {
    if (!chartSvgRef.current) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * dynamicWaveData.width;
    const y = ((e.clientY - rect.top) / rect.height) * dynamicWaveData.height;
    setMouseCoords({ x, y, active: true });
  };

  const handleSvgMouseLeave = () => {
    setMouseCoords({ x: null, y: null, active: false });
    setHoveredPointIndex(null);
  };

  // Exportation analytique Excel
  const handleExportExcel = () => {
    try {
      exportAnalyticsToXLSX(
        invoices,
        payments,
        quotes,
        companyInfo,
        `FacturX_Rapport_Analytique_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      if (onToast) {
        onToast("Rapport analytique complet exporté avec succès en Excel !", "success");
      }
    } catch (e) {
      if (onToast) {
        onToast("Erreur lors de la génération du rapport Excel.", "error");
      }
    }
  };

  // Calcul dynamique et réel du DSO (Délai Moyen de Paiement en jours)
  const realDso = useMemo(() => {
    // 1. Calcul basé sur les règlements réels si disponibles
    const settlementDays = [];
    if (Array.isArray(payments) && payments.length > 0) {
      payments.forEach((p) => {
        const inv = invoices.find((i) => i.id === p.invoice_id || i.id === p.invoiceId);
        if (inv && inv.issueDate && (p.paymentDate || p.payment_date)) {
          const parseDate = (str) => {
            if (!str) return null;
            const pts = str.split("/");
            if (pts.length === 3) return new Date(parseInt(pts[2], 10), parseInt(pts[1], 10) - 1, parseInt(pts[0], 10));
            const iso = new Date(str);
            return isNaN(iso.getTime()) ? null : iso;
          };
          const issueD = parseDate(inv.issueDate);
          const payD = parseDate(p.paymentDate || p.payment_date);
          if (issueD && payD && payD >= issueD) {
            const diff = Math.round((payD - issueD) / (1000 * 60 * 60 * 24));
            settlementDays.push(diff);
          }
        }
      });
    }

    if (settlementDays.length > 0) {
      const avg = Math.round(settlementDays.reduce((a, b) => a + b, 0) / settlementDays.length);
      return Math.max(1, avg);
    }

    // 2. Formule comptable standard : (Créances clients en cours / Chiffre d'Affaires global) * 30 jours
    if (analyticsData.totalBilled > 0) {
      const totalReceivables = analyticsData.totalOverdue + analyticsData.totalPending;
      const calculatedDso = Math.round((totalReceivables / analyticsData.totalBilled) * 30);
      return Math.max(1, calculatedDso || 14);
    }

    return 14;
  }, [payments, invoices, analyticsData.totalBilled, analyticsData.totalOverdue, analyticsData.totalPending]);

  // Simulation des gains de trésorerie débloqués
  const simulatedGains = useMemo(() => {
    const cashFromOverdue = Math.round(analyticsData.totalOverdue * (simRecoveryGain / 100));
    const cashFromPending = Math.round(analyticsData.totalPending * 0.20);
    const totalUnlocked = cashFromOverdue + cashFromPending;
    const newRecoveryRate = Math.min(100, analyticsData.recoveryRate + Math.round(simRecoveryGain * 0.4));
    const newDso = Math.max(1, realDso - simDsoReduction);
    return { totalUnlocked, newRecoveryRate, newDso };
  }, [analyticsData, simRecoveryGain, simDsoReduction, realDso]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-16">
      {/* 1. EN-TÊTE DE LA PAGE ANALYTIQUE AVEC FILTRES & EXPORT */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Analytique & Intelligence Financière
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Flux Dynamique & Vagues Actives
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Pilotage en temps réel des encaissements, vagues prévisionnelles et aide décisionnelle pour{" "}
                <span className="font-bold text-slate-700">{companyInfo?.name || "Mon Entreprise"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Contrôles interactifs : Période, Simulateur & Export */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Bouton Outil Décisionnel : Simulateur de Trésorerie */}
          <button
            onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer border ${
              isSimulatorOpen
                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30"
                : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            }`}
            title="Ouvrir le simulateur d'optimisation de trésorerie"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Simulateur Décisionnel</span>
          </button>

          {/* Sélecteur de période */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-2.5 pl-3.5 pr-8 rounded-xl transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="octobre_2026">Mois en cours (Octobre 2026)</option>
              <option value="q4_2026">Trimestre T4 (Oct - Déc 2026)</option>
              <option value="year_2026">Exercice Annuel 2026</option>
              <option value="all_time">Historique Complet</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Bouton Export Excel Pro */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition-all shadow-2xs cursor-pointer"
            title="Télécharger l'analyse complète sous format Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Exporter</span> Rapport
          </button>

          {/* Action Nouvelle Facture */}
          <button
            onClick={onOpenCreateInvoice}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#183BB0] hover:bg-[#122F8C] text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Créer Facture</span>
          </button>
        </div>
      </div>

      {/* 2. BANNIÈRE SIMULATEUR D'AIDE À LA DÉCISION (INTERACTIVE & EXPANDABLE) */}
      {isSimulatorOpen && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-blue-500/30 space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30">
                <Sparkles className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Simulateur Décisionnel d&apos;Optimisation de Trésorerie
                </h3>
                <p className="text-xs text-blue-200/80">
                  Déplacez les curseurs pour modéliser immédiatement l&apos;impact d&apos;une politique de relance active sur vos liquidités
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSimulatorOpen(false)}
              className="text-white/60 hover:text-white p-1.5 rounded-lg self-end sm:self-auto cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Curseur 1 : Objectif de recouvrement des impayés */}
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-blue-200">Taux de recouvrement ciblé</span>
                <span className="font-black text-emerald-400 text-sm">+{simRecoveryGain}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={simRecoveryGain}
                onChange={(e) => setSimRecoveryGain(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-2 bg-white/20 rounded-lg"
              />
              <p className="text-[11px] text-white/70">
                Relance ciblée sur les {analyticsData.countOverdue} dossiers en retard ({formatAmount(analyticsData.totalOverdue, currencySymbol)})
              </p>
            </div>

            {/* Curseur 2 : Réduction du délai DSO */}
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-blue-200">Accélération des paiements</span>
                <span className="font-black text-amber-300 text-sm">-{simDsoReduction} jours</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={simDsoReduction}
                onChange={(e) => setSimDsoReduction(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-white/20 rounded-lg"
              />
              <p className="text-[11px] text-white/70">
                DSO prévisionnel abaissé à <strong>{simulatedGains.newDso} jours</strong> au lieu de {realDso}j
              </p>
            </div>

            {/* Résultat d'impact financier immédiat */}
            <div className="bg-gradient-to-tr from-emerald-600/30 to-teal-500/20 p-5 rounded-2xl border border-emerald-400/40 space-y-2">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                Cash Immédiat Débloqué Projeté
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-300 tracking-tight">
                +{formatAmount(simulatedGains.totalUnlocked, currencySymbol)}
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-200/90 pt-1">
                <span>Nouveau Taux : {simulatedGains.newRecoveryRate}%</span>
                <button
                  onClick={() => {
                    setTableFilter("overdue");
                    setIsSimulatorOpen(false);
                    if (onToast) {
                      onToast("Affichage des dossiers prioritaires à relancer pour sécuriser ce cash.", "success");
                    }
                  }}
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-extrabold text-[11px] rounded-lg transition-all cursor-pointer shadow-sm"
                >
                  Appliquer ce plan →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. RANGÉE DES 4 KPIS DÉCISIONNELS STRATÉGIQUES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1 : Chiffre d'Affaires Facturé */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3 hover:border-blue-200 transition-all group hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Facturé (TTC)
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatAmount(analyticsData.totalBilled, currencySymbol)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="font-bold text-emerald-600 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +14.2%
              </span>
              <span className="text-slate-500">vs mois précédent</span>
            </div>
          </div>
          {/* Jauge sous-jacente animée */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-700" style={{ width: "85%" }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>{analyticsData.countBilled} factures émises</span>
            <span className="font-semibold text-slate-700">85% obj. atteint</span>
          </div>
        </div>

        {/* KPI 2 : Trésorerie Encaissée */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3 hover:border-emerald-200 transition-all group hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Trésorerie Encaissée
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
              {formatAmount(analyticsData.totalPaid, currencySymbol)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Taux {analyticsData.recoveryRate}%
              </span>
              <span className="text-slate-500 font-medium">de recouvrement</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${analyticsData.recoveryRate}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>{analyticsData.countPaid} factures soldées</span>
            <span className="font-semibold text-emerald-700">Solde sécurisé</span>
          </div>
        </div>

        {/* KPI 3 : Factures en Retard Critique (Alerte Impayés) */}
        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs space-y-3 hover:border-rose-300 transition-all group bg-gradient-to-br from-white to-rose-50/25 hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              Retards Critiques
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-rose-700 tracking-tight">
              {formatAmount(analyticsData.totalOverdue, currencySymbol)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                {analyticsData.countOverdue} facture(s) en souffrance
              </span>
            </div>
          </div>
          <div className="w-full bg-rose-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-rose-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, analyticsData.overdueRate * 2.5)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-rose-700 font-bold pt-0.5">
            <span>Action urgente requise</span>
            <button
              onClick={() => setTableFilter("overdue")}
              className="underline hover:text-rose-900 cursor-pointer text-[10px]"
            >
              Voir les dossiers →
            </button>
          </div>
        </div>

        {/* KPI 4 : En Cours & Délais de Paiement (DSO) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3 hover:border-amber-200 transition-all group hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              En cours & Délai DSO
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {realDso} jours
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Délai moyen règlement
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.round((realDso / 30) * 100))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Moyenne secteur : 28 jours</span>
            <span className="font-semibold text-emerald-600">
              {realDso <= 28 ? `Performance +${Math.round(((28 - realDso) / 28) * 100)}%` : "Délai à optimiser"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. LE CŒUR ANALYTIQUE : VAGUES DYNAMIQUES & INTERACTIVES (COURBES VIVANTES RÉACTIVES AU CURSEUR) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAPHIQUE DES VAGUES DYNAMIQUES (2 COLONNES) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-xs space-y-5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  Vagues Dynamiques : Facturation vs Recouvrement Réel
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                  Réactif au Curseur
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Survolez le graphique n&apos;importe où : les vagues ondulent, réagissent au passage de la souris et calculent le cash-flow en temps réel
              </p>
            </div>

            {/* Commandes des vagues et commutateurs */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {/* Bouton Pause/Play de l'animation */}
              <button
                onClick={() => setIsWaveActive(!isWaveActive)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs"
                title={isWaveActive ? "Suspendre l'ondulation" : "Reprendre l'ondulation"}
              >
                {isWaveActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-blue-600" />}
              </button>

              {/* Intensité de la houle */}
              <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-[11px] font-bold">
                <button
                  onClick={() => setWaveIntensity("gentle")}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    waveIntensity === "gentle" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Ondulation douce"
                >
                  Douce
                </button>
                <button
                  onClick={() => setWaveIntensity("normal")}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    waveIntensity === "normal" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Ondulation standard"
                >
                  Fluide
                </button>
                <button
                  onClick={() => setWaveIntensity("pulse")}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    waveIntensity === "pulse" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Ondulation dynamique et pulsante"
                >
                  Pulsante
                </button>
              </div>

              {/* Sélecteur Mensuel / Hebdo */}
              <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-xs font-bold">
                <button
                  onClick={() => setTimelineMode("monthly")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    timelineMode === "monthly" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  6 Mois
                </button>
                <button
                  onClick={() => setTimelineMode("weekly")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    timelineMode === "weekly" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Hebdo
                </button>
              </div>

              {/* Filtre de courbes */}
              <div className="flex items-center gap-1 text-xs font-bold">
                <button
                  onClick={() => setActiveCurveMetric(activeCurveMetric === "billed" ? "both" : "billed")}
                  className={`px-2 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                    activeCurveMetric === "billed" || activeCurveMetric === "both"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-white text-slate-400 border-slate-200"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  Facturé
                </button>
                <button
                  onClick={() => setActiveCurveMetric(activeCurveMetric === "paid" ? "both" : "paid")}
                  className={`px-2 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                    activeCurveMetric === "paid" || activeCurveMetric === "both"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-white text-slate-400 border-slate-200"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Encaissé
                </button>
              </div>
            </div>
          </div>

          {/* Canvas SVG du Graphique des Vagues Réactives */}
          <div className="relative pt-2">
            <svg
              ref={chartSvgRef}
              viewBox={`0 0 ${dynamicWaveData.width} ${dynamicWaveData.height}`}
              className="w-full h-60 sm:h-72 overflow-visible cursor-crosshair select-none"
              onMouseMove={handleSvgMouseMove}
              onMouseLeave={handleSvgMouseLeave}
            >
              <defs>
                {/* Dégradé fluide courbe Facturé */}
                <linearGradient id="gradientBilledWave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#3B82F6" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
                {/* Dégradé fluide courbe Encaissé */}
                <linearGradient id="gradientPaidWave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16A34A" stopOpacity="0.45" />
                  <stop offset="65%" stopColor="#22C55E" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#16A34A" stopOpacity="0.0" />
                </linearGradient>
                {/* Filtre de lueur néon pour la vague active */}
                <filter id="waveGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Lignes de grille horizontales en pointillés fins */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = dynamicWaveData.padding.top + dynamicWaveData.innerHeight * pct;
                return (
                  <line
                    key={i}
                    x1={dynamicWaveData.padding.left}
                    y1={y}
                    x2={dynamicWaveData.width - dynamicWaveData.padding.right}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Couche d'ambiance volumétrique (Echo Wave) */}
              {(activeCurveMetric === "both" || activeCurveMetric === "billed") && (
                <path
                  d={dynamicWaveData.pathEcho}
                  fill="none"
                  stroke="#93C5FD"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                  opacity="0.5"
                />
              )}

              {/* Aires sous les vagues */}
              {(activeCurveMetric === "both" || activeCurveMetric === "billed") && (
                <path d={dynamicWaveData.areaBilled} fill="url(#gradientBilledWave)" />
              )}
              {(activeCurveMetric === "both" || activeCurveMetric === "paid") && (
                <path d={dynamicWaveData.areaPaid} fill="url(#gradientPaidWave)" />
              )}

              {/* Tracés fluides des Vagues */}
              {(activeCurveMetric === "both" || activeCurveMetric === "billed") && (
                <path
                  d={dynamicWaveData.pathBilled}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#waveGlow)"
                />
              )}
              {(activeCurveMetric === "both" || activeCurveMetric === "paid") && (
                <path
                  d={dynamicWaveData.pathPaid}
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#waveGlow)"
                />
              )}

              {/* Ligne laser verticale fluide réagissant au curseur partout où il se déplace */}
              {mouseCoords.active && mouseCoords.x !== null && (
                <g className="transition-all duration-75">
                  <line
                    x1={mouseCoords.x}
                    y1={dynamicWaveData.padding.top}
                    x2={mouseCoords.x}
                    y2={dynamicWaveData.padding.top + dynamicWaveData.innerHeight}
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="animate-pulse"
                  />
                  {/* Point laser sur la position de la souris */}
                  <circle
                    cx={mouseCoords.x}
                    cy={mouseCoords.y}
                    r="8"
                    fill="#3B82F6"
                    fillOpacity="0.2"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                  />
                  <circle cx={mouseCoords.x} cy={mouseCoords.y} r="3" fill="#1D4ED8" />
                </g>
              )}

              {/* Points discrets sur les jalons temporels */}
              {timelineSeries.map((d, i) => {
                const ptBilled = dynamicWaveData.keyPointsBilled[i];
                const ptPaid = dynamicWaveData.keyPointsPaid[i];
                const isHovered = hoveredPointIndex === i;

                return (
                  <g
                    key={i}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredPointIndex(i)}
                  >
                    {/* Point Facturé */}
                    {(activeCurveMetric === "both" || activeCurveMetric === "billed") && (
                      <circle
                        cx={ptBilled.x}
                        cy={ptBilled.y}
                        r={isHovered ? 7 : 4.5}
                        fill="#FFFFFF"
                        stroke="#2563EB"
                        strokeWidth="3"
                        className="transition-all duration-200 drop-shadow-sm"
                      />
                    )}

                    {/* Point Encaissé */}
                    {(activeCurveMetric === "both" || activeCurveMetric === "paid") && (
                      <circle
                        cx={ptPaid.x}
                        cy={ptPaid.y}
                        r={isHovered ? 7 : 4.5}
                        fill="#FFFFFF"
                        stroke="#16A34A"
                        strokeWidth="3"
                        className="transition-all duration-200 drop-shadow-sm"
                      />
                    )}

                    {/* Libellé axe X */}
                    <text
                      x={ptBilled.x}
                      y={dynamicWaveData.height - 10}
                      textAnchor="middle"
                      className={`text-[10px] font-bold ${
                        isHovered ? "fill-blue-700 font-extrabold" : "fill-slate-500"
                      }`}
                    >
                      {d.label.split(" ")[0]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Infobulle Flottante Interactive en Temps Réel suivant le Curseur */}
            {mouseCoords.active && dynamicWaveData.cursorValBilled !== null && (
              <div
                className="absolute top-2 pointer-events-none z-30 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl text-xs space-y-1.5 border border-slate-700 transition-all duration-100 min-w-[210px]"
                style={{
                  left: `${Math.min(dynamicWaveData.width - 230, Math.max(20, mouseCoords.x - 100))}px`,
                }}
              >
                <div className="font-extrabold text-blue-200 border-b border-slate-800 pb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    Valeur Temps Réel
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    Écart : {formatAmount(Math.abs(dynamicWaveData.cursorValBilled - dynamicWaveData.cursorValPaid), currencySymbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Facturé estimé :
                  </span>
                  <span className="font-bold text-white">
                    {formatAmount(dynamicWaveData.cursorValBilled, currencySymbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Encaissé réel :
                  </span>
                  <span className="font-bold text-emerald-300">
                    {formatAmount(dynamicWaveData.cursorValPaid, currencySymbol)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Synthèse dynamique sous les vagues */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-center gap-3 hover:bg-blue-50 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                CA
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-900 uppercase">Facturation Portefeuille</p>
                <p className="text-xs font-extrabold text-blue-950">
                  {formatAmount(analyticsData.totalBilled, currencySymbol)}
                </p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex items-center gap-3 hover:bg-emerald-50 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                OK
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-900 uppercase">Recouvrement Réalisé</p>
                <p className="text-xs font-extrabold text-emerald-950">
                  {formatAmount(analyticsData.totalPaid, currencySymbol)}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100 flex items-center gap-3 hover:bg-amber-50 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                FL
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-900 uppercase">Trésorerie à Encaisser</p>
                <p className="text-xs font-extrabold text-amber-950">
                  {formatAmount(analyticsData.totalPending + analyticsData.totalOverdue, currencySymbol)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* DONUT INTERACTIF SANTÉ DU PORTEFEUILLE (1 COLONNE) */}
        <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Santé de la Facturation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Ventilation des statuts réels</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Score A+
              </span>
            </div>

            {/* Donut Chart SVG avec micro-animation */}
            <div className="relative flex items-center justify-center py-6">
              <svg viewBox="0 0 200 200" className="w-44 h-44 -rotate-90">
                {/* Anneau de fond */}
                <circle
                  cx="100"
                  cy="100"
                  r={donutData.radius}
                  fill="transparent"
                  stroke="#F1F5F9"
                  strokeWidth="24"
                />

                {/* Segments dynamiques */}
                {donutData.segments.map((seg) => {
                  const isHovered = hoveredDonutSegment === seg.id;
                  return (
                    <circle
                      key={seg.id}
                      cx="100"
                      cy="100"
                      r={donutData.radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={isHovered ? 28 : 24}
                      strokeDasharray={`${seg.strokeLength} ${seg.circumference}`}
                      strokeDashoffset={seg.strokeDashoffset}
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredDonutSegment(seg.id)}
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                    />
                  );
                })}
              </svg>

              {/* Indicateur Central Dynamique */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                {hoveredDonutSegment ? (
                  (() => {
                    const activeSeg = donutData.segments.find((s) => s.id === hoveredDonutSegment);
                    return (
                      <div className="animate-fadeIn">
                        <span className="text-[11px] font-bold text-slate-500 uppercase block">
                          {activeSeg.label.split(" ")[0]}
                        </span>
                        <span className="text-xl font-extrabold text-slate-900 block">
                          {activeSeg.percent}%
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block">
                          {activeSeg.count} facture(s)
                        </span>
                      </div>
                    );
                  })()
                ) : (
                  <div className="animate-fadeIn">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                      Recouvrement
                    </span>
                    <span className="text-2xl font-black text-slate-900 block tracking-tight">
                      {analyticsData.recoveryRate}%
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 block">
                      {analyticsData.countPaid} sur {analyticsData.countBilled} payées
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Légende interactive cliquable */}
            <div className="space-y-2 pt-2">
              {donutData.segments.map((seg) => {
                const isHovered = hoveredDonutSegment === seg.id;
                return (
                  <div
                    key={seg.id}
                    onClick={() => {
                      if (seg.id === "payee") setTableFilter("payee");
                      else if (seg.id === "en_attente") setTableFilter("overdue");
                      else if (seg.id === "envoyee") setTableFilter("pending");
                      else setTableFilter("all");
                    }}
                    onMouseEnter={() => setHoveredDonutSegment(seg.id)}
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isHovered
                        ? "bg-slate-50 border-slate-300 shadow-2xs scale-[1.02]"
                        : "bg-white border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3 h-3 rounded-full ${seg.bgClass}`} />
                      <span className="text-xs font-bold text-slate-700">{seg.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-900 block">
                        {formatAmount(seg.amount, currencySymbol)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {seg.count} fact. ({seg.percent}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-500 border border-slate-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              Cliquez un statut pour filtrer l&apos;audit
            </span>
            <button
              onClick={() => setTableFilter("all")}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* 5. ANALYSE DÉCISIONNELLE : « QUI PAYE VS QUI NE PAYE PAS » (ACTIONS DYNAMISÉES) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLONNE A : TOP CLIENTS & MEILLEURS PAYEURS (FIABILITÉ 100%) */}
        <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Meilleurs Payeurs (Ponctualité & Volume)
                </h3>
                <p className="text-xs text-slate-500">
                  Entreprises qui honorent leurs engagements et alimentent votre cash-flow
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              {analyticsData.topPayers.length} Partenaire(s)
            </span>
          </div>

          <div className="space-y-3">
            {analyticsData.topPayers.slice(0, 4).map((client, idx) => {
              const paidPercentOfTotal = Math.round(
                (client.totalPaid / (analyticsData.totalPaid || 1)) * 100
              );
              return (
                <div
                  key={client.clientName}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-200 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                        #{idx + 1}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                          {client.clientName}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            Fiable à 100%
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {client.contactPerson || "Contact Entreprise"} • {client.location || "RDC"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-700 block">
                        {formatAmount(client.totalPaid, currencySymbol)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {client.paidInvoicesCount} facture(s) réglée(s)
                      </span>
                    </div>
                  </div>

                  {/* Barre de part de cash */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 w-2/3">
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, paidPercentOfTotal * 1.5)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 min-w-[32px]">
                        {paidPercentOfTotal}%
                      </span>
                    </div>

                    {/* Actions connectées */}
                    <button
                      onClick={() => {
                        const targetClient = clients.find((c) => c.name === client.clientName) || {
                          name: client.clientName,
                          contactPerson: client.contactPerson,
                          email: client.email,
                          phone: client.phone,
                          location: client.location,
                        };
                        onOpenClientProfile(targetClient);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      Fiche 360° <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs text-emerald-900 flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              Ces clients méritent des conditions tarifaires préférentielles pour fidélisation.
            </span>
            <button
              onClick={() => onNavigateToTab("quotes")}
              className="font-bold underline text-emerald-800 text-[11px] cursor-pointer"
            >
              Nouveau Devis
            </button>
          </div>
        </div>

        {/* COLONNE B : CLIENTS EN RETARD & ALERTES TRÉSORERIE (ACTIONS RELANCES DYNAMISÉES) */}
        <div className="bg-white p-5 sm:p-7 rounded-3xl border border-rose-100 shadow-xs space-y-5 bg-gradient-to-b from-white to-rose-50/20">
          <div className="flex items-center justify-between border-b border-rose-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-rose-950">
                  Retards de Paiement & Vigilance
                </h3>
                <p className="text-xs text-slate-500">
                  Clients avec factures échues nécessitant une relance urgente
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-full animate-pulse">
              {analyticsData.overdueClients.length} Dossier(s)
            </span>
          </div>

          <div className="space-y-3">
            {analyticsData.overdueClients.length > 0 ? (
              analyticsData.overdueClients.map((client) => {
                const overdueInvoice =
                  client.invoicesList.find((i) => i.status === "en_attente") || client.invoicesList[0];
                return (
                  <div
                    key={client.clientName}
                    className="p-4 rounded-2xl border border-rose-200/80 bg-white hover:border-rose-400 transition-all shadow-2xs group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                          {client.clientName}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold">
                            Échéance Dépassée
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {client.contactPerson || "Direction"} • {client.phone || "+243 ..."}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-rose-700 block">
                          {formatAmount(client.totalOverdue, currencySymbol)}
                        </span>
                        <span className="text-[10px] font-bold text-rose-500">
                          {overdueInvoice ? `Facture ${overdueInvoice.id}` : "Créance en cours"}
                        </span>
                      </div>
                    </div>

                    {/* Diagnostic et actions immédiates dynamisées */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        Échéance au {overdueInvoice?.dueDate || "20/10/2026"} (Retard critique)
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {/* Bouton Relance Immédiate avec Modale Interactive */}
                        <button
                          onClick={() => {
                            if (overdueInvoice) {
                              setReminderModalInvoice(overdueInvoice);
                              setIsReminderSent(false);
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer group-hover:scale-105"
                        >
                          <Send className="w-3 h-3 text-white" />
                          Relance Express ⚡
                        </button>

                        {/* Bouton Voir Facture */}
                        <button
                          onClick={() => {
                            if (overdueInvoice) {
                              onOpenInvoice(overdueInvoice);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Détails
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Aucun client en retard critique actuellement. Votre trésorerie est saine !
              </div>
            )}
          </div>

          <div className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200 text-xs text-rose-900 flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <Zap className="w-4 h-4 text-rose-600" />
              Une relance sous 24h augmente de 78% la probabilité de règlement sous 4 jours.
            </span>
            <button
              onClick={() => onNavigateToTab("invoices")}
              className="font-bold underline text-rose-800 text-[11px] cursor-pointer"
            >
              Gérer Factures
            </button>
          </div>
        </div>
      </div>

      {/* 6. ENTONNOIR DE CONVERSION & MIX DES CANAUX D'ENCAISSEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ENTONNOIR DE CONVERSION COMMERCIALE (2 COLONNES) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                Pipeline & Entonnoir de Conversion Commerciale
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                De l&apos;estimation initiale au paiement réel en compte bancaire
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Taux Final : {analyticsData.quoteConversionRate}%
            </span>
          </div>

          {/* Étapes de l'entonnoir interactif */}
          <div className="space-y-3.5">
            {/* Étape 1 : Devis Émis */}
            <div
              onClick={() => onNavigateToTab("quotes")}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 hover:bg-slate-100/80 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-black text-[11px] flex items-center justify-center">
                    1
                  </span>
                  Devis & Propositions Émises
                </span>
                <span className="font-black text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                  {formatAmount(analyticsData.totalQuotesVolume || 61538000, currencySymbol)}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full rounded-full transition-all duration-500" style={{ width: "100%" }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>{quotes.length || 5} propositions commerciales actives</span>
                <span className="font-semibold text-slate-700">Base pipeline 100% →</span>
              </div>
            </div>

            {/* Étape 2 : Devis Acceptés / Facturés */}
            <div
              onClick={() => {
                setTableFilter("all");
              }}
              className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2 hover:bg-blue-50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-[11px] flex items-center justify-center">
                    2
                  </span>
                  Factures Émises et Confirmées
                </span>
                <span className="font-black text-blue-900 text-sm group-hover:scale-105 transition-transform">
                  {formatAmount(analyticsData.totalBilled, currencySymbol)}
                </span>
              </div>
              <div className="w-full bg-blue-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, analyticsData.quoteConversionRate)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-blue-700 font-medium">
                <span>{analyticsData.countBilled} factures éditées</span>
                <span>Taux de signature {analyticsData.quoteConversionRate}%</span>
              </div>
            </div>

            {/* Étape 3 : Règlements Encaissés (Cash Réel) */}
            <div
              onClick={() => setTableFilter("payee")}
              className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2 hover:bg-emerald-50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center">
                    3
                  </span>
                  Règlements Sécurisés & Encaissés
                </span>
                <span className="font-black text-emerald-700 text-sm group-hover:scale-105 transition-transform">
                  {formatAmount(analyticsData.totalPaid, currencySymbol)}
                </span>
              </div>
              <div className="w-full bg-emerald-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${analyticsData.recoveryRate}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-emerald-800 font-bold">
                <span>{analyticsData.countPaid} règlements soldés en banque</span>
                <span>Recouvrement final {analyticsData.recoveryRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* CANAUX D'ENCAISSEMENT (1 COLONNE) */}
        <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Canaux d&apos;Encaissement
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Mix bancaire & Mobile Money</p>
              </div>
              <CreditCard className="w-5 h-5 text-slate-400" />
            </div>

            <div className="space-y-3.5 pt-3">
              {/* Virement Bancaire */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" /> Virement (Rawbank, TMB)
                  </span>
                  <span className="font-extrabold text-slate-900">62%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: "62%" }} />
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>Délai d&apos;imputation : 24-48h</span>
                  <span className="font-semibold text-slate-600">Canal B2B Privilégié</span>
                </div>
              </div>

              {/* Mobile Money */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" /> Mobile Money (Airtel, M-Pesa)
                  </span>
                  <span className="font-extrabold text-slate-900">28%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: "28%" }} />
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>Instantané (QR & API)</span>
                  <span className="font-semibold text-emerald-600">0% impayé</span>
                </div>
              </div>

              {/* Chèques certifiés & Autres */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-amber-600" /> Chèques & Autres
                  </span>
                  <span className="font-extrabold text-slate-900">10%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: "10%" }} />
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>Dépôt agence bancaire</span>
                  <span className="font-semibold text-slate-600">Gros montants</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab("payments")}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:border-slate-300"
          >
            Accéder au Registre des Paiements →
          </button>
        </div>
      </div>

      {/* 7. TABLEAU DÉTAILLÉ & DYNAMIQUE DES FACTURES DU PORTEFEUILLE */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden space-y-4 p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
              Audit Analytique des Factures
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cliquez sur les en-têtes pour trier les colonnes et déclenchez les actions de relance directement
            </p>
          </div>

          {/* Recherche & Filtres Rapides */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher client, n° facture..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48 sm:w-56"
              />
            </div>

            {/* Onglets Filtres */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
              <button
                onClick={() => setTableFilter("all")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  tableFilter === "all"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Toutes ({invoices.length})
              </button>
              <button
                onClick={() => setTableFilter("overdue")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  tableFilter === "overdue"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "text-rose-700 hover:text-rose-900"
                }`}
              >
                🔴 Retard ({analyticsData.countOverdue})
              </button>
              <button
                onClick={() => setTableFilter("pending")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  tableFilter === "pending"
                    ? "bg-amber-500 text-white shadow-2xs"
                    : "text-amber-700 hover:text-amber-900"
                }`}
              >
                🟠 En attente ({analyticsData.countPending})
              </button>
              <button
                onClick={() => setTableFilter("payee")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  tableFilter === "payee"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-emerald-700 hover:text-emerald-900"
                }`}
              >
                🟢 Payées ({analyticsData.countPaid})
              </button>
            </div>
          </div>
        </div>

        {/* Table responsive avec tri dynamique par colonne */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSort("id")}
                  className="pb-3 pl-2 cursor-pointer hover:text-blue-600 transition-colors"
                >
                  N° Facture {sortColumn === "id" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("client")}
                  className="pb-3 cursor-pointer hover:text-blue-600 transition-colors"
                >
                  Client & Contact {sortColumn === "client" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("issueDate")}
                  className="pb-3 cursor-pointer hover:text-blue-600 transition-colors"
                >
                  Émission / Échéance {sortColumn === "issueDate" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("total")}
                  className="pb-3 text-right cursor-pointer hover:text-blue-600 transition-colors"
                >
                  Montant TTC {sortColumn === "total" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="pb-3 text-center cursor-pointer hover:text-blue-600 transition-colors"
                >
                  Statut FacturX {sortColumn === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="pb-3 text-center">Diagnostic Décisionnel</th>
                <th className="pb-3 pr-2 text-right">Action Immédiate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedInvoices.map((inv) => {
                const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
                const isOverdue = inv.status === "en_attente";
                const isPaid = inv.status === "payee";
                const isPending = inv.status === "envoyee";

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* N° Facture */}
                    <td className="py-3.5 pl-2 font-extrabold text-blue-700">
                      <button
                        onClick={() => onOpenInvoice(inv)}
                        className="hover:underline text-left cursor-pointer flex items-center gap-1"
                      >
                        {inv.id}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </td>

                    {/* Client */}
                    <td className="py-3.5">
                      <div className="font-extrabold text-slate-900">{inv.clientName}</div>
                      <div className="text-[11px] text-slate-500">
                        {inv.contactPerson || inv.clientEmail}
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="py-3.5">
                      <div className="font-medium text-slate-700">{inv.issueDate}</div>
                      <div
                        className={`text-[11px] font-bold ${
                          isOverdue ? "text-rose-600" : "text-slate-400"
                        }`}
                      >
                        Échéance : {inv.dueDate}
                      </div>
                    </td>

                    {/* Montant TTC */}
                    <td className="py-3.5 text-right font-black text-slate-900">
                      {formatAmount(total, currencySymbol)}
                    </td>

                    {/* Badge de statut officiel FacturX */}
                    <td className="py-3.5 text-center">
                      {isPaid && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> Payée
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" /> Envoyée
                        </span>
                      )}
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3] animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" /> En retard
                        </span>
                      )}
                      {inv.status === "brouillon" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" /> Brouillon
                        </span>
                      )}
                    </td>

                    {/* Diagnostic Décisionnel */}
                    <td className="py-3.5 text-center">
                      {isPaid && (
                        <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                          Encaissé à 100%
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[11px] text-slate-600 font-medium">
                          Délai respecté (J-5)
                        </span>
                      )}
                      {isOverdue && (
                        <span className="text-[11px] text-rose-700 font-extrabold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          ⚠️ Relance requise
                        </span>
                      )}
                      {inv.status === "brouillon" && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          À finaliser
                        </span>
                      )}
                    </td>

                    {/* Actions Dynamisées */}
                    <td className="py-3.5 pr-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isOverdue && (
                          <button
                            onClick={() => {
                              setReminderModalInvoice(inv);
                              setIsReminderSent(false);
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                            title="Envoyer un rappel de paiement express"
                          >
                            <Zap className="w-3 h-3" />
                            Relancer
                          </button>
                        )}
                        <button
                          onClick={() => onOpenInvoice(inv)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-all cursor-pointer"
                        >
                          Détails
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. MODALE DYNAMIQUE DE RELANCE EXPRESS 1-CLIC */}
      {reminderModalInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-100 shadow-2xl relative animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Send className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Relance Express de Paiement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Facture {reminderModalInvoice.id} • {reminderModalInvoice.clientName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReminderModalInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sélecteur de canal de relance */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Canal d&apos;envoi prioritaire
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReminderChannel("whatsapp")}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    reminderChannel === "whatsapp"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  <span>WhatsApp Business</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReminderChannel("email")}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    reminderChannel === "email"
                      ? "bg-blue-50 border-blue-500 text-blue-800 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span>Email Formel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReminderChannel("call")}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    reminderChannel === "call"
                      ? "bg-purple-50 border-purple-500 text-purple-800 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Phone className="w-5 h-5 text-purple-600" />
                  <span>Appel Direct DG</span>
                </button>
              </div>
            </div>

            {/* Message pré-généré dynamique */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
              <span className="font-extrabold text-slate-900 block text-[11px] uppercase tracking-wider">
                Aperçu du message généré pour {reminderModalInvoice.contactPerson || "le responsable financier"} :
              </span>
              <p className="italic text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                « Bonjour {reminderModalInvoice.contactPerson || "Monsieur/Madame"}, sauf erreur de notre part, la facture{" "}
                <strong>{reminderModalInvoice.id}</strong> d&apos;un montant de{" "}
                <strong>
                  {formatAmount(calculateInvoiceTotals(reminderModalInvoice.items, reminderModalInvoice.vatRate).total, currencySymbol)}
                </strong>{" "}
                arrivée à échéance le <strong>{reminderModalInvoice.dueDate}</strong> est toujours en attente de règlement. Pourriez-vous nous transmettre la preuve de virement ? Nos coordonnées : {companyInfo.bankName || "Rawbank"} {companyInfo.iban || "CD00 RAWB ..."}. Bien cordialement, La Direction {companyInfo?.name || "Mon Entreprise"}. »
              </p>
            </div>

            {/* Action d'envoi avec feedback immédiat */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setReminderModalInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsReminderSent(true);
                  setTimeout(() => {
                    if (onToast) {
                      onToast(`Relance envoyée avec succès à ${reminderModalInvoice.clientName} via ${reminderChannel.toUpperCase()} !`, "success");
                    }
                    setReminderModalInvoice(null);
                  }, 900);
                }}
                disabled={isReminderSent}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                {isReminderSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white animate-spin" />
                    <span>Transmission en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-white" />
                    <span>Envoyer la Relance Immédiatement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
