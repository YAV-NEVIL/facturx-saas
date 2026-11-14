import { NextResponse } from 'next/server';
import { ensureInvoiceDgiCertification } from '@/lib/dgi-service';

export async function POST(request) {
  try {
    const body = await request.json();
    const { invoice = {}, companyInfo = {}, sequenceHint = null } = body || {};

    const dgiMode = companyInfo?.dgiMode || 'sandbox';
    const dgiApiToken = companyInfo?.dgiApiToken || process.env.DGI_EMCF_API_TOKEN || '';
    const dgiApiUrl = process.env.DGI_EMCF_API_URL || '';

    // En mode Production avec URL et Jeton API e-MCF fournis, tentative d'appel au serveur MCF/e-MCF DGI
    if (dgiMode === 'production' && dgiApiToken && dgiApiUrl) {
      try {
        const externalRes = await fetch(`${dgiApiUrl.replace(/\/$/, '')}/api/invoice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${dgiApiToken}`,
          },
          body: JSON.stringify({
            nif: companyInfo?.nif || '',
            rn: companyInfo?.rccm || '',
            nim: companyInfo?.dgiNim || '',
            isf: companyInfo?.dgiIsf || '',
            type: invoice?.dgiInvoiceType || 'FV',
            items: (invoice?.items || []).map((item) => ({
              name: item.description,
              price: Number(item.unitPrice || 0),
              quantity: Number(item.quantity || 1),
              taxGroup: invoice?.dgiTaxGroup || companyInfo?.dgiDefaultTaxGroup || 'B',
            })),
            client: {
              name: invoice?.clientName || '',
              nif: invoice?.clientTaxId || '',
            },
          }),
        });

        if (externalRes.ok) {
          const externalData = await externalRes.json();
          const certified = ensureInvoiceDgiCertification(
            {
              ...invoice,
              dgiCodeDef: externalData.codeDEFDGI || externalData.codeDef || invoice.dgiCodeDef,
              dgiCounters: externalData.counters || invoice.dgiCounters,
              dgiNim: externalData.nim || companyInfo?.dgiNim,
              dgiQrPayload: externalData.qrCode || invoice.dgiQrPayload,
              dgiCertifiedAt: externalData.dateTime || new Date().toISOString(),
            },
            companyInfo,
            sequenceHint
          );
          return NextResponse.json({
            success: true,
            mode: 'production',
            certification: certified,
          });
        }
      } catch (err) {
        console.warn('[DGI e-MCF] Bascule sécurisée sur le moteur SFE local :', err?.message);
      }
    }

    // Moteur SFE / e-MCF embarqué (Homologation Sandbox ou Secours Hors-Ligne)
    const certification = ensureInvoiceDgiCertification(invoice, companyInfo, sequenceHint);

    return NextResponse.json({
      success: true,
      mode: dgiMode,
      certification,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Erreur lors de la certification DGI SFE.',
      },
      { status: 500 }
    );
  }
}
