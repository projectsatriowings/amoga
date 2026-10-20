/**
 * AMOGA E-COMMERCE — PROMOTIONS & COUPONS CONTROLLER (DECOMMISSIONED)
 * All coupon and promo code functionality has been fully removed from the database and storefront.
 */

export async function listCoupons(req, res) {
  return res.status(404).json({ success: false, error: 'DECOMMISSIONED', message: 'Promotions system has been decommissioned' });
}

export async function createCoupon(req, res) {
  return res.status(404).json({ success: false, error: 'DECOMMISSIONED', message: 'Promotions system has been decommissioned' });
}

export async function updateCoupon(req, res) {
  return res.status(404).json({ success: false, error: 'DECOMMISSIONED', message: 'Promotions system has been decommissioned' });
}

export async function toggleCoupon(req, res) {
  return res.status(404).json({ success: false, error: 'DECOMMISSIONED', message: 'Promotions system has been decommissioned' });
}

export async function deleteCoupon(req, res) {
  return res.status(404).json({ success: false, error: 'DECOMMISSIONED', message: 'Promotions system has been decommissioned' });
}

export async function validateCheckoutCoupon(req, res) {
  return res.status(404).json({ success: false, error: 'DECOMMISSIONED', message: 'Promotions system has been decommissioned' });
}
