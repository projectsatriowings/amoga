import { prisma } from '../config/prisma.js';
import { verifyGuestAccessToken } from '../utils/security.js';

/**
 * Generate external carrier tracking link if carrier and waybill are present
 */
function getCarrierTrackingUrl(carrier, trackingNumber, existingUrl) {
  if (existingUrl) return existingUrl;
  if (!carrier || !trackingNumber) return null;

  const lower = carrier.toLowerCase();
  const cleanNumber = encodeURIComponent(trackingNumber.trim());

  if (lower.includes('blue dart') || lower.includes('bluedart')) {
    return `https://www.bluedart.com/tracking?trackNumber=${cleanNumber}`;
  }
  if (lower.includes('delhivery')) {
    return `https://www.delhivery.com/track/package/${cleanNumber}`;
  }
  if (lower.includes('dhl')) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${cleanNumber}`;
  }
  if (lower.includes('fedex')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${cleanNumber}`;
  }
  if (lower.includes('india post') || lower.includes('speed post')) {
    return `https://www.indiapost.gov.in/_layouts/15/dpt.cpt.trackconsignment/trackconsignment.aspx`;
  }

  return null;
}

/**
 * Build standard chronological milestones from order state and history
 */
function buildMilestones(order, trackingEvents) {
  const status = order.status;
  const isCancelled = status === 'CANCELLED';

  // Standard pipeline steps
  const orderDate = order.createdAt;
  const findEventTime = (st) => {
    const ev = trackingEvents.find((e) => e.status === st);
    return ev ? ev.createdAt : null;
  };

  const steps = [
    {
      key: 'CONFIRMED',
      title: 'Order Confirmed',
      description: 'Payment authorized and verified at Amoga Atelier.',
      time: findEventTime('CONFIRMED') || orderDate,
    },
    {
      key: 'PROCESSING',
      title: 'Processing at Atelier',
      description: 'Master artisans inspecting, packaging, and preparing for dispatch.',
      time: findEventTime('PROCESSING'),
    },
    {
      key: 'DISPATCHED',
      title: 'Shipped & In Transit',
      description: order.carrier
        ? `Handed over to ${order.carrier}${order.trackingNumber ? ` (AWB: ${order.trackingNumber})` : ''}.`
        : 'Dispatched with premium logistics partner.',
      time: findEventTime('DISPATCHED'),
    },
    {
      key: 'DELIVERED',
      title: 'Delivered',
      description: 'Successfully delivered and signed for by recipient.',
      time: findEventTime('DELIVERED'),
    },
  ];

  const statusOrder = ['PENDING_PAYMENT', 'PENDING_CONFIRMATION', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'];
  const currentIndex = statusOrder.indexOf(status);

  return steps.map((s, idx) => {
    const stepIdx = statusOrder.indexOf(s.key);
    let state = 'UPCOMING';
    if (isCancelled) {
      state = 'CANCELLED';
    } else if (stepIdx < currentIndex) {
      state = 'COMPLETED';
    } else if (stepIdx === currentIndex) {
      state = 'CURRENT';
    }

    return {
      ...s,
      state,
      isPassed: stepIdx <= currentIndex && !isCancelled,
      isCurrent: stepIdx === currentIndex && !isCancelled,
    };
  });
}

/**
 * Public & Authorized Order Tracking endpoint
 */
export async function trackOrder(req, res) {
  try {
    const { orderReference } = req.params;
    const { email: queryEmail, phone: queryPhone } = req.query;

    if (!orderReference) {
      return res.status(400).json({
        success: false,
        error: 'REFERENCE_REQUIRED',
        message: 'Order reference is required.',
      });
    }

    const order = await prisma.order.findUnique({
      where: { orderReference: orderReference.trim() },
      include: {
        items: true,
        trackingEvents: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: `Order "${orderReference}" could not be found. Please check your reference number.`,
      });
    }

    // Determine verification level:
    // 1. Authenticated customer who owns the order
    const isCustomerOwner =
      req.customer &&
      (order.customerId === req.customer.id ||
        order.customerEmail.toLowerCase() === req.customer.email.toLowerCase());

    // 2. Valid guest access token header
    let isGuestTokenValid = false;
    const guestHeader = req.headers['x-guest-access-token'];
    if (guestHeader && order.guestAccessTokenHash) {
      isGuestTokenValid = verifyGuestAccessToken(guestHeader, order.guestAccessTokenHash);
    }

    // 3. Email or Phone verification matching the order
    let isCredentialVerified = false;
    if (queryEmail && queryEmail.trim().toLowerCase() === order.customerEmail.toLowerCase()) {
      isCredentialVerified = true;
    }
    if (queryPhone && queryPhone.trim().replace(/\D/g, '') === order.customerPhone.replace(/\D/g, '')) {
      isCredentialVerified = true;
    }

    const isFullyVerified = isCustomerOwner || isGuestTokenValid || isCredentialVerified;

    const milestones = buildMilestones(order, order.trackingEvents);
    const trackingUrl = getCarrierTrackingUrl(order.carrier, order.trackingNumber, order.trackingUrl);

    if (!isFullyVerified) {
      // Return safe masked public tracking data (protects customer privacy against ID enumeration)
      return res.status(200).json({
        success: true,
        isMasked: true,
        verificationRequired: true,
        message: 'Please provide your email address or phone number to view private delivery details.',
        tracking: {
          orderReference: order.orderReference,
          status: order.status,
          paymentStatus: order.paymentStatus,
          carrier: order.carrier,
          trackingNumber: order.trackingNumber,
          trackingUrl,
          createdAt: order.createdAt,
          destinationCity: `${order.city}, ${order.state}`,
          milestones,
          events: order.trackingEvents.map((ev) => ({
            id: ev.id,
            status: ev.status,
            title: ev.title,
            description: ev.description,
            location: ev.location,
            createdAt: ev.createdAt,
          })),
        },
      });
    }

    // Fully verified response
    return res.status(200).json({
      success: true,
      isMasked: false,
      verificationRequired: false,
      tracking: {
        orderReference: order.orderReference,
        status: order.status,
        paymentStatus: order.paymentStatus,
        currency: order.currency,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        trackingUrl,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        deliveryDestination: {
          addressLine1: order.addressLine1,
          addressLine2: order.addressLine2,
          city: order.city,
          state: order.state,
          pincode: order.pincode,
          instructions: order.deliveryInstructions,
        },
        financialTotals: {
          subtotal: Number(order.subtotal),
          shippingAmount: Number(order.shippingAmount),
          taxAmount: Number(order.taxAmount),
          discountAmount: Number(order.discountAmount),
          totalAmount: Number(order.totalAmount),
        },
        items: order.items.map((i) => ({
          id: i.id,
          productName: i.productName,
          collectionId: i.collectionId,
          variantName: i.variantName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
          image: i.image,
        })),
        milestones,
        events: order.trackingEvents.map((ev) => ({
          id: ev.id,
          status: ev.status,
          title: ev.title,
          description: ev.description,
          location: ev.location,
          carrier: ev.carrier,
          trackingNumber: ev.trackingNumber,
          actor: ev.actor,
          createdAt: ev.createdAt,
        })),
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error('[TRACK ORDER ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve tracking details',
    });
  }
}
