import { supabase } from "./supabaseClient.js";

/**
 * SERVICE ENTREPRISE (Company Profile)
 */
export async function fetchCompanyProfile(companyId = null) {
  let query = supabase.from("companies").select("*");
  if (companyId) {
    query = query.eq("id", companyId);
  } else {
    query = query.order("created_at", { ascending: false }).limit(1);
  }
  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Erreur fetchCompanyProfile:", error);
    throw error;
  }
  return data;
}

export async function createCompany(companyData) {
  const nameStr = (companyData.name || "Mon Entreprise").trim();
  const initialsStr =
    companyData.initials ||
    nameStr
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    "FX";

  const payload = {
    name: nameStr,
    subtitle: companyData.subtitle || "Société commerciale",
    tagline: companyData.tagline || "",
    initials: initialsStr,
    logo_url: companyData.logoUrl || null,
    rccm: companyData.rccm || "",
    id_nat: companyData.idNat || "",
    nif: companyData.nif || "",
    ninea: companyData.ninea || "",
    address: companyData.address || "",
    bp: companyData.bp || "",
    city: companyData.city || "",
    country: companyData.country || "",
    country_code: companyData.countryCode || "CD",
    phone_country_code: companyData.phoneCountryCode || "+243",
    phone_digits: companyData.phoneDigits || "",
    phone: companyData.phone || "",
    mobile: companyData.mobile || "",
    email: companyData.email || "",
    website: companyData.website || "",
    default_currency: companyData.defaultCurrency || "Franc Congolais (CDF / FC)",
    currency_symbol: companyData.currencySymbol || "FC",
    default_vat_rate: typeof companyData.defaultVatRate === "number" ? companyData.defaultVatRate : 0.16,
    bank_name: companyData.bankName || "",
    bank_custom_name: companyData.bankCustomName || "",
    iban: companyData.iban || "",
    airtel_money_number: companyData.airtelMoneyNumber || "",
    orange_money_number: companyData.orangeMoneyNumber || "",
    wave_number: companyData.waveNumber || "",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("companies")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Erreur createCompany:", error);
    throw error;
  }
  return data;
}

export async function upsertCompanyProfile(companyData) {
  // Mapper les champs camelCase vers snake_case si nécessaire
  const payload = {
    name: companyData.name || "Mon Entreprise",
    subtitle: companyData.subtitle || "",
    tagline: companyData.tagline || "",
    initials: companyData.initials || "FX",
    logo_url: companyData.logoUrl || null,
    rccm: companyData.rccm || "",
    id_nat: companyData.idNat || "",
    nif: companyData.nif || "",
    ninea: companyData.ninea || "",
    address: companyData.address || "",
    bp: companyData.bp || "",
    city: companyData.city || "",
    country: companyData.country || "",
    country_code: companyData.countryCode || "CD",
    phone_country_code: companyData.phoneCountryCode || "+243",
    phone_digits: companyData.phoneDigits || "",
    phone: companyData.phone || "",
    mobile_country_code: companyData.mobileCountryCode || "+243",
    mobile_digits: companyData.mobileDigits || "",
    mobile: companyData.mobile || "",
    email: companyData.email || "",
    website: companyData.website || "",
    default_currency: companyData.defaultCurrency || "Franc Congolais (CDF / FC)",
    currency_symbol: companyData.currencySymbol || "FC",
    default_vat_rate: typeof companyData.defaultVatRate === "number" ? companyData.defaultVatRate : 0.16,
    bank_name: companyData.bankName || "",
    bank_custom_name: companyData.bankCustomName || "",
    iban: companyData.iban || "",
    airtel_money_number: companyData.airtelMoneyNumber || "",
    orange_money_number: companyData.orangeMoneyNumber || "",
    wave_number: companyData.waveNumber || "",
    updated_at: new Date().toISOString(),
  };

  if (companyData.id) {
    payload.id = companyData.id;
  }

  const { data, error } = await supabase
    .from("companies")
    .upsert(payload)
    .select()
    .single();

  if (error) {
    console.error("Erreur upsertCompanyProfile:", error);
    throw error;
  }
  return data;
}

/**
 * SERVICE CLIENTS (CRM)
 */
export async function fetchClients(companyId = null) {
  let query = supabase.from("clients").select("*").order("name", { ascending: true });
  if (companyId) {
    query = query.eq("company_id", companyId);
  }
  const { data, error } = await query;

  if (error) {
    console.error("Erreur fetchClients:", error);
    throw error;
  }

  // Mapper snake_case vers le format attendu par les composants
  return (data || []).map((c) => ({
    id: c.id,
    name: c.name,
    contactPerson: c.contact_person || "",
    phone: c.phone || "",
    email: c.email || "",
    address: c.address || "",
    location: c.location || "",
    taxId: c.tax_id || c.nif || "",
    rccm: c.rccm || "",
    nif: c.nif || "",
    ninea: c.ninea || "",
    countryCode: c.country_code || "CD",
    notes: c.notes || "",
    createdAt: c.created_at,
  }));
}

export async function createClient(client, companyId = null) {
  if (!client.name || !client.name.trim()) {
    throw new Error("Nom de client requis");
  }

  const compId = client.companyId || companyId || null;

  // Vérifier si un client avec ce nom existe déjà pour cette entreprise
  let existingQuery = supabase
    .from("clients")
    .select("*")
    .ilike("name", client.name.trim())
    .limit(1);

  if (compId) {
    existingQuery = existingQuery.eq("company_id", compId);
  }

  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      companyId: existing.company_id,
      name: existing.name,
      contactPerson: existing.contact_person,
      phone: existing.phone,
      email: existing.email,
      address: existing.address,
      location: existing.location,
      taxId: existing.tax_id,
      rccm: existing.rccm,
      nif: existing.nif,
      ninea: existing.ninea,
      countryCode: existing.country_code,
      notes: existing.notes,
      createdAt: existing.created_at,
    };
  }

  const payload = {
    name: client.name.trim(),
    contact_person: client.contactPerson || "",
    phone: client.phone || "",
    email: client.email || "",
    address: client.address || "",
    location: client.location || "",
    tax_id: client.taxId || client.nif || "",
    rccm: client.rccm || "",
    nif: client.nif || "",
    ninea: client.ninea || "",
    country_code: client.countryCode || "CD",
    notes: client.notes || "",
  };

  if (compId) {
    payload.company_id = compId;
  }

  const { data, error } = await supabase
    .from("clients")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Erreur createClient:", error);
    throw error;
  }

  return {
    id: data.id,
    companyId: data.company_id,
    name: data.name,
    contactPerson: data.contact_person,
    phone: data.phone,
    email: data.email,
    address: data.address,
    location: data.location,
    taxId: data.tax_id,
    rccm: data.rccm,
    nif: data.nif,
    ninea: data.ninea,
    countryCode: data.country_code,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

export async function updateClient(id, client) {
  let targetId = id;

  // Si l'identifiant n'est pas un UUID Supabase valide, cherchons par nom
  const isUuid =
    typeof targetId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);

  if (!isUuid) {
    const searchName = client.name || id;
    if (searchName) {
      const { data: existing } = await supabase
        .from("clients")
        .select("id")
        .ilike("name", String(searchName).trim())
        .limit(1)
        .maybeSingle();
      if (existing?.id) {
        targetId = existing.id;
      }
    }
  }

  // Si le client n'existe toujours pas dans Supabase, le créer automatiquement
  if (!targetId || targetId === id && !isUuid) {
    return await createClient(client);
  }

  const payload = {
    name: client.name,
    contact_person: client.contactPerson || "",
    phone: client.phone || "",
    email: client.email || "",
    address: client.address || "",
    location: client.location || "",
    tax_id: client.taxId || client.nif || "",
    rccm: client.rccm || "",
    nif: client.nif || "",
    ninea: client.ninea || "",
    country_code: client.countryCode || "CD",
    notes: client.notes || "",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", targetId)
    .select()
    .single();

  if (error) {
    console.error("Erreur updateClient:", error);
    throw error;
  }
  return {
    id: data.id,
    name: data.name,
    contactPerson: data.contact_person,
    phone: data.phone,
    email: data.email,
    address: data.address,
    location: data.location,
    taxId: data.tax_id,
    rccm: data.rccm,
    nif: data.nif,
    ninea: data.ninea,
    countryCode: data.country_code,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

export async function deleteClient(id) {
  let targetId = id;
  const isUuid =
    typeof targetId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);

  if (!isUuid) {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .ilike("name", String(id).trim())
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      targetId = existing.id;
    }
  }

  if (!targetId) {
    return true;
  }

  const { error } = await supabase.from("clients").delete().eq("id", targetId);
  if (error) {
    console.error("Erreur deleteClient:", error);
    throw error;
  }
  return true;
}

/**
 * SERVICE FACTURES (Invoices + Items)
 */
export async function fetchInvoices(companyId = null) {
  let query = supabase
    .from("invoices")
    .select(`
      *,
      items:invoice_items(*)
    `)
    .order("created_at", { ascending: false });

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erreur fetchInvoices:", error);
    throw error;
  }

  return (data || []).map((inv) => ({
    id: inv.id,
    clientId: inv.client_id,
    clientName: inv.client_name,
    contactPerson: inv.contact_person || "",
    clientEmail: inv.client_email || "",
    clientPhone: inv.client_phone || "",
    address: inv.address || "",
    location: inv.location || "",
    taxId: inv.tax_id || "",
    issueDate: inv.issue_date,
    dueDate: inv.due_date,
    status: inv.status,
    vatRate: Number(inv.vat_rate) || 0.16,
    subtotal: Number(inv.subtotal) || 0,
    vatAmount: Number(inv.vat_amount) || 0,
    total: Number(inv.total) || 0,
    notes: inv.notes || "",
    company: inv.company_snapshot || null,
    reminders: inv.reminders || [],
    convertedFromQuoteId: inv.converted_from_quote_id || null,
    items: (inv.items || [])
      .sort((a, b) => (a.item_order || 0) - (b.item_order || 0))
      .map((it) => ({
        id: it.id,
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unit_price) || 0,
      })),
  }));
}

export async function createInvoice(invoice, companyId = null) {
  const compId = invoice.companyId || companyId || null;
  // 1. Résolution automatique et garantie du client_id
  let resolvedClientId = invoice.clientId || null;
  if (!resolvedClientId && invoice.clientName) {
    try {
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .ilike("name", invoice.clientName.trim())
        .limit(1)
        .maybeSingle();

      if (existingClient && existingClient.id) {
        resolvedClientId = existingClient.id;
      } else {
        // Si le client n'existe pas encore en base, le créer proprement
        const { data: newCl } = await supabase
          .from("clients")
          .insert([
            {
              name: invoice.clientName.trim(),
              contact_person: invoice.contactPerson || "",
              email: invoice.clientEmail || "",
              phone: invoice.clientPhone || "",
              address: invoice.address || "",
              location: invoice.location || "",
              tax_id: invoice.taxId || "",
              country_code: "CD",
            },
          ])
          .select("id")
          .single();
        if (newCl && newCl.id) {
          resolvedClientId = newCl.id;
        }
      }
    } catch (e) {
      console.warn("Erreur résolution client_id pour la facture:", e);
    }
  }

  // 2. Calcul des totaux
  const subtotal = (invoice.items || []).reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );
  const vatRate = typeof invoice.vatRate === "number" ? invoice.vatRate : 0.16;
  const vatAmount = Math.round(subtotal * vatRate);
  const total = subtotal + vatAmount;

  // 3. Insérer la facture
  const invoicePayload = {
    id: invoice.id,
    client_id: resolvedClientId,
    client_name: invoice.clientName,
    contact_person: invoice.contactPerson || "",
    client_email: invoice.clientEmail || "",
    client_phone: invoice.clientPhone || "",
    address: invoice.address || "",
    location: invoice.location || "",
    tax_id: invoice.taxId || "",
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate,
    status: invoice.status || "envoyee",
    vat_rate: vatRate,
    subtotal,
    vat_amount: vatAmount,
    total,
    notes: invoice.notes || "",
    company_snapshot: invoice.company || null,
    reminders: invoice.reminders || [],
    converted_from_quote_id: invoice.convertedFromQuoteId || null,
  };

  if (compId) {
    invoicePayload.company_id = compId;
  }

  const { error: invError } = await supabase
    .from("invoices")
    .insert([invoicePayload]);

  if (invError) {
    console.error("Erreur createInvoice:", invError);
    throw invError;
  }

  // 3. Insérer les articles associés
  if (invoice.items && invoice.items.length > 0) {
    const itemsPayload = invoice.items.map((it, idx) => ({
      invoice_id: invoice.id,
      description: it.description,
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.unitPrice) || 0,
      item_order: idx,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemsPayload);

    if (itemsError) {
      console.error("Erreur createInvoice items:", itemsError);
    }
  }

  return {
    ...invoice,
    subtotal,
    vatAmount,
    total,
  };
}

export async function updateInvoice(invoice) {
  let resolvedClientId = invoice.clientId || null;
  if (!resolvedClientId && invoice.clientName) {
    try {
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .ilike("name", invoice.clientName.trim())
        .limit(1)
        .maybeSingle();
      if (existingClient?.id) {
        resolvedClientId = existingClient.id;
      }
    } catch (e) {
      console.warn("Erreur résolution client_id dans updateInvoice:", e);
    }
  }

  const subtotal = (invoice.items || []).reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );
  const vatRate = typeof invoice.vatRate === "number" ? invoice.vatRate : 0.16;
  const vatAmount = Math.round(subtotal * vatRate);
  const total = subtotal + vatAmount;

  const invoicePayload = {
    client_id: resolvedClientId,
    client_name: invoice.clientName,
    contact_person: invoice.contactPerson || "",
    client_email: invoice.clientEmail || "",
    client_phone: invoice.clientPhone || "",
    address: invoice.address || "",
    location: invoice.location || "",
    tax_id: invoice.taxId || "",
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate,
    status: invoice.status || "envoyee",
    vat_rate: vatRate,
    subtotal,
    vat_amount: vatAmount,
    total,
    notes: invoice.notes || "",
    converted_from_quote_id: invoice.convertedFromQuoteId || null,
    updated_at: new Date().toISOString(),
  };

  if (Array.isArray(invoice.reminders)) {
    invoicePayload.reminders = invoice.reminders;
  }

  const { error: invError } = await supabase
    .from("invoices")
    .update(invoicePayload)
    .eq("id", invoice.id);

  if (invError) {
    console.error("Erreur updateInvoice:", invError);
    throw invError;
  }

  // Mettre à jour les articles : supprimer et réinsérer
  if (invoice.items) {
    await supabase.from("invoice_items").delete().eq("invoice_id", invoice.id);
    if (invoice.items.length > 0) {
      const itemsPayload = invoice.items.map((it, idx) => ({
        invoice_id: invoice.id,
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unitPrice) || 0,
        item_order: idx,
      }));
      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsPayload);
      if (itemsError) {
        console.error("Erreur updateInvoice items:", itemsError);
        throw itemsError;
      }
    }
  }

  return { ...invoice, clientId: resolvedClientId, subtotal, vatAmount, total };
}

export async function updateInvoiceStatus(id, newStatus) {
  const { data, error } = await supabase
    .from("invoices")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erreur updateInvoiceStatus:", error);
    throw error;
  }
  return data;
}

export async function addInvoiceReminder(id, newReminder) {
  // Récupérer les rappels existants
  const { data: inv, error: fetchErr } = await supabase
    .from("invoices")
    .select("reminders")
    .eq("id", id)
    .single();

  if (fetchErr) throw fetchErr;

  const currentReminders = inv.reminders || [];
  const updatedReminders = [newReminder, ...currentReminders];

  const { data, error } = await supabase
    .from("invoices")
    .update({ reminders: updatedReminders, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteInvoice(id) {
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) {
    console.error("Erreur deleteInvoice:", error);
    throw error;
  }
  return true;
}

/**
 * SERVICE DEVIS (Quotes + Items)
 */
export async function fetchQuotes(companyId = null) {
  let query = supabase
    .from("quotes")
    .select(`
      *,
      items:quote_items(*)
    `)
    .order("created_at", { ascending: false });

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erreur fetchQuotes:", error);
    throw error;
  }

  return (data || []).map((q) => ({
    id: q.id,
    clientId: q.client_id,
    clientName: q.client_name,
    contactPerson: q.contact_person || "",
    clientEmail: q.client_email || "",
    clientPhone: q.client_phone || "",
    address: q.address || "",
    location: q.location || "",
    taxId: q.tax_id || "",
    issueDate: q.issue_date,
    expiryDate: q.expiry_date || q.valid_until || "",
    validUntil: q.valid_until || q.expiry_date || "",
    status: q.status,
    vatRate: Number(q.vat_rate) || 0.16,
    subtotal: Number(q.subtotal) || 0,
    vatAmount: Number(q.vat_amount) || 0,
    total: Number(q.total) || 0,
    notes: q.notes || "",
    convertedToInvoiceId: q.converted_to_invoice_id,
    items: (q.items || [])
      .sort((a, b) => (a.item_order || 0) - (b.item_order || 0))
      .map((it) => ({
        id: it.id,
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unit_price) || 0,
      })),
  }));
}

export async function createQuote(quote, companyId = null) {
  const compId = quote.companyId || companyId || null;
  // 1. Résolution automatique et garantie du client_id
  let resolvedClientId = quote.clientId || null;
  if (!resolvedClientId && quote.clientName) {
    try {
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .ilike("name", quote.clientName.trim())
        .limit(1)
        .maybeSingle();

      if (existingClient && existingClient.id) {
        resolvedClientId = existingClient.id;
      }
    } catch (e) {
      console.warn("Erreur résolution client_id pour le devis:", e);
    }
  }

  const subtotal = (quote.items || []).reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );
  const vatRate = typeof quote.vatRate === "number" ? quote.vatRate : 0.16;
  const vatAmount = Math.round(subtotal * vatRate);
  const total = subtotal + vatAmount;

  const validUntilStr = quote.validUntil || quote.expiryDate || "";

  const quotePayload = {
    id: quote.id,
    client_id: resolvedClientId,
    client_name: quote.clientName,
    contact_person: quote.contactPerson || "",
    client_email: quote.clientEmail || "",
    client_phone: quote.clientPhone || "",
    address: quote.address || "",
    location: quote.location || "",
    tax_id: quote.taxId || "",
    issue_date: quote.issueDate,
    expiry_date: validUntilStr,
    valid_until: validUntilStr,
    status: quote.status || "en_attente",
    vat_rate: vatRate,
    subtotal,
    vat_amount: vatAmount,
    total,
    notes: quote.notes || "",
    converted_to_invoice_id: quote.convertedToInvoiceId || null,
  };

  if (compId) {
    quotePayload.company_id = compId;
  }

  const { error: quoteErr } = await supabase.from("quotes").insert([quotePayload]);
  if (quoteErr) throw quoteErr;

  if (quote.items && quote.items.length > 0) {
    const itemsPayload = quote.items.map((it, idx) => ({
      quote_id: quote.id,
      description: it.description,
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.unitPrice) || 0,
      item_order: idx,
    }));
    const { error: itemsErr } = await supabase.from("quote_items").insert(itemsPayload);
    if (itemsErr) console.error("Erreur createQuote items:", itemsErr);
  }

  return { ...quote, subtotal, vatAmount, total };
}

export async function updateQuoteStatus(id, newStatus, convertedInvoiceId = null) {
  const updatePayload = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (convertedInvoiceId) {
    updatePayload.converted_to_invoice_id = convertedInvoiceId;
  }

  const { data, error } = await supabase
    .from("quotes")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteQuote(id) {
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/**
 * SERVICE PAIEMENTS (Payments)
 */
export async function fetchPayments(companyId = null) {
  let query = supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erreur fetchPayments:", error);
    throw error;
  }

  return (data || []).map((p) => ({
    id: p.id,
    invoiceId: p.invoice_id,
    clientName: p.client_name,
    contactPerson: p.contact_person || "",
    clientEmail: p.client_email || "",
    clientPhone: p.client_phone || "",
    amount: Number(p.amount) || 0,
    currency: "FC",
    paymentDate: p.payment_date,
    paymentTime: p.payment_time || "",
    paymentMethod: p.method || "",
    method: p.method || "",
    bankName: p.bank_name || "",
    channel: p.channel || "virement",
    transactionRef: p.transaction_ref || p.reference || "",
    reference: p.reference || p.transaction_ref || "",
    beneficiaryAccount: p.beneficiary_account || "",
    status: p.status || "valide",
    note: p.notes || "",
    notes: p.notes || "",
    receiptNumber: p.receipt_number || "",
    recordedBy: p.recorded_by || "",
    createdAt: p.created_at,
  }));
}

export async function createPayment(payment, companyId = null) {
  const compId = payment.companyId || companyId || null;
  const methodStr = payment.paymentMethod || payment.method || "Virement Bancaire";
  const refStr = payment.transactionRef || payment.reference || "";
  const noteStr = payment.note || payment.notes || "";

  const payload = {
    id: payment.id || `PAY-${Date.now()}`,
    invoice_id: payment.invoiceId || null,
    client_name: payment.clientName,
    contact_person: payment.contactPerson || "",
    client_email: payment.clientEmail || "",
    client_phone: payment.clientPhone || "",
    amount: Number(payment.amount) || 0,
    payment_date: payment.paymentDate,
    payment_time: payment.paymentTime || "",
    method: methodStr,
    channel: payment.channel || "virement",
    bank_name: payment.bankName || "",
    transaction_ref: refStr,
    reference: refStr,
    beneficiary_account: payment.beneficiaryAccount || "",
    status: payment.status || "valide",
    notes: noteStr,
    receipt_number: payment.receiptNumber || "",
    recorded_by: payment.recordedBy || "",
  };

  if (compId) {
    payload.company_id = compId;
  }

  const { data, error } = await supabase
    .from("payments")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Erreur createPayment:", error);
    throw error;
  }
  return data;
}

export async function updatePayment(payment) {
  const methodStr = payment.paymentMethod || payment.method || "Virement Bancaire";
  const refStr = payment.transactionRef || payment.reference || "";
  const noteStr = payment.note || payment.notes || "";

  const payload = {
    method: methodStr,
    channel: payment.channel || "virement",
    bank_name: payment.bankName || "",
    transaction_ref: refStr,
    reference: refStr,
    payment_date: payment.paymentDate,
    payment_time: payment.paymentTime || "",
    notes: noteStr,
  };

  const { data, error } = await supabase
    .from("payments")
    .update(payload)
    .eq("id", payment.id)
    .select()
    .single();

  if (error) {
    console.error("Erreur updatePayment:", error);
    throw error;
  }
  return data;
}

export async function deletePayment(id) {
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) {
    console.error("Erreur deletePayment:", error);
    throw error;
  }
  return true;
}

/**
 * SERVICE ÉQUIPE & COLLABORATEURS (Team Members)
 */
export async function fetchTeamMembers(companyId = null) {
  let query = supabase
    .from("team_members")
    .select("*")
    .order("created_at", { ascending: true });

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erreur fetchTeamMembers:", error);
    throw error;
  }

  return (data || []).map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    badge: m.badge || (
      m.role === "admin" ? "Propriétaire" :
      m.role === "comptable" ? "Comptabilité" :
      m.role === "commercial" ? "Commercial" :
      m.role === "gestionnaire_stock" ? "Gestionnaire Stock" : "Collaborateur"
    ),
    status: m.status || "Actif",
    initials: m.initials || m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
    phone: m.phone || "",
    lastLogin: m.last_login ? new Date(m.last_login).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "Récent",
    companyId: m.company_id,
  }));
}

export async function updateMemberOnlineStatus(email, isOnline = true) {
  try {
    const payload = {
      status: isOnline ? "En ligne" : "Hors ligne",
      last_login: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("team_members")
      .update(payload)
      .eq("email", email.trim().toLowerCase());
    if (error) console.warn("Erreur updateMemberOnlineStatus:", error);
  } catch (err) {
    console.warn("Exception updateMemberOnlineStatus:", err);
  }
}

export async function createTeamMember(member, companyId = null) {
  const initials = member.initials || member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const badge = member.badge || (
    member.role === "admin" ? "Propriétaire" :
    member.role === "comptable" ? "Comptabilité" :
    member.role === "commercial" ? "Commercial" :
    member.role === "gestionnaire_stock" ? "Gestionnaire Stock" : "Collaborateur"
  );

  const compId = member.companyId || companyId || null;

  const payload = {
    name: member.name,
    email: member.email,
    role: member.role || "comptable",
    badge: badge,
    status: member.status || "Actif",
    initials: initials,
    phone: member.phone || "",
  };

  if (compId) {
    payload.company_id = compId;
  }

  const { data, error } = await supabase
    .from("team_members")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Erreur createTeamMember:", error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    badge: data.badge,
    status: data.status,
    initials: data.initials,
    phone: data.phone,
    lastLogin: "À l'instant",
  };
}

export async function updateTeamMember(id, member) {
  const payload = {};
  if (member.name !== undefined) payload.name = member.name;
  if (member.email !== undefined) payload.email = member.email;
  if (member.role !== undefined) payload.role = member.role;
  if (member.badge !== undefined) payload.badge = member.badge;
  if (member.status !== undefined) payload.status = member.status;
  if (member.phone !== undefined) payload.phone = member.phone;
  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("team_members")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erreur updateTeamMember:", error);
    throw error;
  }

  return data;
}

export async function deleteTeamMember(id) {
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) {
    console.error("Erreur deleteTeamMember:", error);
    throw error;
  }
  return true;
}

/**
 * SERVICE AUTHENTIFICATION SUPABASE (Supabase Auth)
 */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email, password, fullName, role = "comptable", phone = "") {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
        phone: phone,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function verifyEmailOtp(email, token, type = "signup") {
  // 1. Tenter la vérification avec le type spécifié (ex: 'signup')
  let result = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: type,
  });

  // 2. Si le type signup échoue ou si le token est de type 'email'
  if (result.error && type === "signup") {
    const fallback = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: "email",
    });
    if (!fallback.error) {
      result = fallback;
    }
  }

  if (result.error) throw result.error;
  return result.data;
}

export async function resendVerificationOtp(email, type = "signup") {
  const { data, error } = await supabase.auth.resend({
    type: type,
    email: email.trim().toLowerCase(),
  });
  if (error) throw error;
  return data;
}

export async function sendLoginOtp(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      shouldCreateUser: false,
    },
  });
  if (error) throw error;
  return data;
}

export async function syncAuthUserWithTeamMember(authUser, profileData = {}) {
  try {
    const email = authUser?.email || profileData?.email;
    if (!email) return null;

    const userMeta = authUser?.user_metadata || {};
    const name = profileData.fullName || userMeta.full_name || email.split("@")[0];
    const requestedRole = profileData.role || userMeta.role || "comptable";
    const role = requestedRole === "admin" && !profileData.allowAdmin ? "comptable" : requestedRole;
    const phone = profileData.phone || userMeta.phone || "";

    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const badge =
      role === "admin"
        ? "Propriétaire"
        : role === "comptable"
        ? "Comptabilité"
        : role === "commercial"
        ? "Commercial"
        : "Gestionnaire Stock";

    // Vérifier si le membre existe déjà
    const { data: existing } = await supabase
      .from("team_members")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existing?.id) {
      // Mettre à jour avec statut En ligne
      await supabase
        .from("team_members")
        .update({
          user_id: authUser?.id || null,
          name: name,
          role: role,
          badge: badge,
          status: "En ligne",
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Insérer nouveau collaborateur
      const compId = profileData.companyId || null;
      const insertPayload = {
        user_id: authUser?.id || null,
        name: name,
        email: email.toLowerCase(),
        role: role,
        badge: badge,
        status: "En ligne",
        initials: initials,
        phone: phone,
        last_login: new Date().toISOString(),
      };
      if (compId) {
        insertPayload.company_id = compId;
      }
      await supabase.from("team_members").insert([insertPayload]);
    }

    return {
      fullName: name,
      email: email.toLowerCase(),
      role: role,
      badge: badge,
      initials: initials,
      phone: phone,
    };
  } catch (err) {
    console.warn("Erreur syncAuthUserWithTeamMember:", err);
    return null;
  }
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.warn("getSession error:", error);
    return null;
  }
  return session;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}



/**
 * ONBOARDING COMPLET NOUVELLE ENTREPRISE + ADMIN APRES VALIDATION DU CODE OTP
 */
export async function completeAdminOnboardingAfterOtp({
  adminName,
  email,
  phone = "",
  companyName,
  currency = "Franc Congolais (CDF / FC)",
  currencySymbol = "FC",
  city = "Kinshasa",
  country = "République Démocratique du Congo",
  countryCode = "CD",
  authUser = null,
}) {
  // 1. Créer la fiche entreprise dans la table companies
  const companyPayload = {
    name: companyName.trim(),
    subtitle: `Entreprise gérée sous FacturX`,
    tagline: `Facturation & Recouvrement certifié`,
    city: city || "Kinshasa",
    country: country || "RDC",
    country_code: countryCode || "CD",
    phone: phone || "",
    email: email.toLowerCase().trim(),
    default_currency: currency,
    currency_symbol: currencySymbol,
    default_vat_rate: 0.16,
  };

  const newCompany = await createCompany(companyPayload);

  // 2. Créer l'administrateur associé dans team_members
  const initials = (adminName || "AD")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AD";

  const memberPayload = {
    company_id: newCompany.id,
    user_id: authUser?.id || null,
    name: adminName.trim(),
    email: email.toLowerCase().trim(),
    role: "admin",
    badge: "Propriétaire",
    status: "En ligne",
    initials: initials,
    phone: phone.trim(),
    last_login: new Date().toISOString(),
  };

  const { data: member, error: memberErr } = await supabase
    .from("team_members")
    .insert([memberPayload])
    .select()
    .single();

  if (memberErr) {
    console.warn("Avertissement insertion admin team_members:", memberErr);
  }

  return {
    fullName: adminName.trim(),
    email: email.toLowerCase().trim(),
    role: "admin",
    badge: "Propriétaire",
    initials: initials,
    phone: phone.trim(),
    companyId: newCompany.id,
    companyName: newCompany.name,
    currency: newCompany.default_currency || currency,
      companyId: profileData.companyId || null,
      currencySymbol: newCompany.currency_symbol || currencySymbol,
      city: newCompany.city || city,
      country: newCompany.country || country,
      countryCode: newCompany.country_code || countryCode,
      isNewOrganization: true,
  };
}
