import {
  searchHsnCandidates,
  listRateMasterEntries,
  createRateMasterEntry,
  updateRateMasterEntry,
  confirmProductTaxClassification,
} from '../services/hsnClassificationService.js';

export async function searchHsnEndpoint(req, res) {
  try {
    const { q, limit, collectionId } = req.query;
    const candidates = await searchHsnCandidates({
      query: q || '',
      limit: limit ? parseInt(limit, 10) : 20,
      collectionId: collectionId || null,
    });
    return res.json({
      success: true,
      query: q || '',
      count: candidates.length,
      candidates,
    });
  } catch (err) {
    console.error('[HSN_SEARCH_ERR]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function listRateMasterEndpoint(req, res) {
  try {
    const { search, status, page, limit } = req.query;
    const result = await listRateMasterEntries({
      search: search || '',
      status: status || null,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[RATE_MASTER_LIST_ERR]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createRateMasterEndpoint(req, res) {
  try {
    const adminEmail = req.admin?.email || 'tax-admin@amoga.com';
    const record = await createRateMasterEntry({
      ...req.body,
      adminEmail,
    });
    return res.status(201).json({ success: true, record });
  } catch (err) {
    console.error('[RATE_MASTER_CREATE_ERR]', err);
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateRateMasterEndpoint(req, res) {
  try {
    const { id } = req.params;
    const adminEmail = req.admin?.email || 'tax-admin@amoga.com';
    const updated = await updateRateMasterEntry(id, req.body, adminEmail);
    return res.json({ success: true, record: updated });
  } catch (err) {
    console.error('[RATE_MASTER_UPDATE_ERR]', err);
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function deactivateRateMasterEndpoint(req, res) {
  try {
    const { id } = req.params;
    const adminEmail = req.admin?.email || 'tax-admin@amoga.com';
    const updated = await updateRateMasterEntry(id, { status: 'INACTIVE' }, adminEmail);
    return res.json({ success: true, record: updated });
  } catch (err) {
    console.error('[RATE_MASTER_DEACTIVATE_ERR]', err);
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function verifyProductTaxEndpoint(req, res) {
  try {
    const { id } = req.params;
    const adminEmail = req.admin?.email || 'tax-admin@amoga.com';
    const adminRole = req.admin?.role || 'CATALOGUE_MANAGER';

    const result = await confirmProductTaxClassification({
      productId: id,
      variantId: req.body.variantId || null,
      hsnCode: req.body.hsnCode,
      gstRate: req.body.gstRate,
      taxTreatment: req.body.taxTreatment || 'TAXABLE',
      isTaxInclusive: req.body.isTaxInclusive !== undefined ? req.body.isTaxInclusive : true,
      cessRate: req.body.cessRate || 0,
      taxNotes: req.body.taxNotes || '',
      adminEmail,
      adminRole,
    });

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[PRODUCT_TAX_VERIFY_ERR]', err);
    return res.status(400).json({ success: false, message: err.message });
  }
}
