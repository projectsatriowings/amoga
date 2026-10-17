/**
 * AMOGA E-COMMERCE — WHATSAPP BILL DELIVERY SERVICE
 * 
 * Handles transactional receipt dispatch via:
 * 1. Official WhatsApp Cloud API (when WHATSAPP_API_TOKEN & WHATSAPP_PHONE_NUMBER_ID are configured in environment)
 * 2. Secure Manual Fallback (when API is not configured or in development mode)
 * 
 * Safety & Privacy:
 * - Validates 10-digit Indian mobile numbers (E.164 +91 format)
 * - Never logs access tokens or exposes raw credentials in client code
 * - Transactional consent with clear opt-out ("reply STOP")
 * - Public receipt accessible via unguessable cryptographic token URL
 */

/**
 * Validates and normalizes Indian mobile number
 * Accepts formats: "+91 9876543210", "919876543210", "09876543210", "9876543210"
 * Returns normalized 12-digit format without +: "919876543210"
 */
export function normalizeIndianPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, message: 'Customer phone number is required.' };
  }

  // Remove spaces, hyphens, parentheses, and leading plus
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');

  // Handle leading 0 (e.g. 09876543210 -> 9876543210)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Handle 10-digit raw number starting with 6, 7, 8, or 9
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return {
      isValid: true,
      raw: phone,
      digits10: cleaned,
      formattedE164: `+91${cleaned}`,
      normalizedWaNumber: `91${cleaned}`,
    };
  }

  // Handle 12-digit number with 91 prefix
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    const digits10 = cleaned.substring(2);
    return {
      isValid: true,
      raw: phone,
      digits10,
      formattedE164: `+${cleaned}`,
      normalizedWaNumber: cleaned,
    };
  }

  return {
    isValid: false,
    message: 'Please provide a valid 10-digit Indian mobile number (e.g., 9876543210 or +91 98765 43210).',
  };
}

/**
 * Checks if official WhatsApp Cloud API credentials are configured in environment
 */
export function isWhatsAppApiConfigured() {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return Boolean(token && phoneId && token.trim().length > 10 && phoneId.trim().length > 3);
}

/**
 * Constructs the professional Amoga POS Receipt WhatsApp message text
 */
export function buildReceiptMessage({
  billNumber,
  createdAt,
  stallName,
  customerName,
  items = [],
  subtotal,
  discountAmount,
  totalAmount,
  paymentMethod,
  receiptUrl,
  sellerTradeName = 'Amoga',
}) {
  const dateStr = new Date(createdAt || Date.now()).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const lines = [];
  lines.push(`🧾 *${sellerTradeName.toUpperCase()} — STORE RECEIPT*`);
  lines.push(`*Bill No:* ${billNumber}`);
  lines.push(`*Date:* ${dateStr}`);
  if (stallName) {
    lines.push(`*Stall/Event:* ${stallName}`);
  }
  if (customerName && customerName.trim()) {
    lines.push(`*Customer:* ${customerName.trim()}`);
  }
  lines.push('');
  lines.push('*Items Purchased:*');

  for (const item of items) {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.lineTotal || item.unitPrice * qty).toFixed(2);
    const varText = item.variantName ? ` (${item.variantName})` : '';
    lines.push(`• ${item.productName}${varText} × ${qty} — ₹${Number(price).toLocaleString('en-IN')}`);
  }

  lines.push('');
  lines.push(`*Subtotal (Incl. GST):* ₹${Number(subtotal).toLocaleString('en-IN')}`);
  if (Number(discountAmount) > 0) {
    lines.push(`*Discount:* -₹${Number(discountAmount).toLocaleString('en-IN')}`);
  }
  lines.push(`*Total Paid:* ₹${Number(totalAmount).toLocaleString('en-IN')} (${paymentMethod || 'CASH'})`);

  if (receiptUrl) {
    lines.push('');
    lines.push(`📄 *View & Download Tax Invoice:*`);
    lines.push(receiptUrl);
  }

  lines.push('');
  lines.push(`_Thank you for celebrating India's handcrafted heritage with ${sellerTradeName}._`);
  lines.push(`_Transactional receipt. To opt out of future updates, reply STOP._`);

  return lines.join('\n');
}

/**
 * Generates WhatsApp Web / Mobile Click-to-Chat deep link for manual delivery fallback
 */
export function generateWhatsAppFallbackLink(phone, messageText) {
  const validation = normalizeIndianPhone(phone);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }
  const encoded = encodeURIComponent(messageText);
  return `https://wa.me/${validation.normalizedWaNumber}?text=${encoded}`;
}

/**
 * Dispatches or prepares WhatsApp bill delivery
 * 
 * If official Cloud API credentials exist, executes HTTP request to Meta Graph API.
 * Otherwise, generates the verified fallback deep-link and instructs the staff.
 */
export async function sendPosBillWhatsApp({
  phone,
  billNumber,
  createdAt,
  stallName,
  customerName,
  items,
  subtotal,
  discountAmount,
  totalAmount,
  paymentMethod,
  receiptUrl,
  sellerTradeName = 'Amoga',
  forceManual = false,
}) {
  const phoneValidation = normalizeIndianPhone(phone);
  if (!phoneValidation.isValid) {
    return {
      success: false,
      error: 'INVALID_PHONE',
      message: phoneValidation.message,
    };
  }

  const messageText = buildReceiptMessage({
    billNumber,
    createdAt,
    stallName,
    customerName,
    items,
    subtotal,
    discountAmount,
    totalAmount,
    paymentMethod,
    receiptUrl,
    sellerTradeName,
  });

  const apiConfigured = isWhatsAppApiConfigured();

  // If Cloud API credentials are NOT present, or manual mode forced, provide manual fallback
  if (!apiConfigured || forceManual) {
    const waLink = generateWhatsAppFallbackLink(phoneValidation.normalizedWaNumber, messageText);
    return {
      success: true,
      deliveryMode: 'MANUAL_FALLBACK',
      recipientPhone: phoneValidation.formattedE164,
      normalizedWaNumber: phoneValidation.normalizedWaNumber,
      waLink,
      actionUrl: waLink,
      messageText,
      instructions:
        'WhatsApp Cloud API credentials are not configured in .env. Click "Open WhatsApp" to send the prefilled bill directly via WhatsApp Web or mobile.',
    };
  }

  // Official Meta WhatsApp Cloud API Dispatch
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_API_TOKEN;
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phoneValidation.normalizedWaNumber,
      type: 'text',
      text: {
        preview_url: Boolean(receiptUrl),
        body: messageText,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn('[WHATSAPP API ERROR RESPONSE]:', data?.error?.message || response.statusText);
      const waLink = generateWhatsAppFallbackLink(phoneValidation.normalizedWaNumber, messageText);
      return {
        success: false,
        deliveryMode: 'API_ERROR_FALLBACK',
        error: data?.error?.message || 'Failed to dispatch via WhatsApp Cloud API',
        waLink,
        actionUrl: waLink,
        messageText,
        recipientPhone: phoneValidation.formattedE164,
      };
    }

    const messageId = data?.messages?.[0]?.id || null;

    return {
      success: true,
      deliveryMode: 'CLOUD_API',
      messageId,
      recipientPhone: phoneValidation.formattedE164,
      sentAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[WHATSAPP DISPATCH EXCEPTION]:', err.message);
    const waLink = generateWhatsAppFallbackLink(phoneValidation.normalizedWaNumber, messageText);
    return {
      success: false,
      deliveryMode: 'EXCEPTION_FALLBACK',
      error: err.message,
      waLink,
      actionUrl: waLink,
      messageText,
      recipientPhone: phoneValidation.formattedE164,
    };
  }
}
