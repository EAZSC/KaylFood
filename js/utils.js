/**
 * KaylFood — Pure Utility Functions & UI Feedback Helpers
 */

export function formatMoney(amount) {
  const num = Math.round(Number(amount) || 0);
  return `${num.toLocaleString('ru-RU')} so'm`;
}

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString('uz-UZ', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function isValidUzbekPhone(phone) {
  const cleaned = String(phone || '').trim();
  return /^\+?[0-9\s\-()]{9,18}$/.test(cleaned);
}

export function generateOrderNumber() {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `KF-${randomDigits}`;
}

/**
 * Pure cart calculation helper (also used in unit tests)
 */
export function calculateCartTotals(items, deliveryFee = 0) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      itemCount: 0,
      subtotal: 0,
      deliveryFee: 0,
      total: 0
    };
  }
  let itemCount = 0;
  let subtotal = 0;
  for (const item of items) {
    const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
    const unitPrice = Math.max(0, Number(item.unitPrice ?? item.price) || 0);
    itemCount += qty;
    subtotal += qty * unitPrice;
  }
  const appliedDelivery = subtotal > 0 ? Math.max(0, Number(deliveryFee) || 0) : 0;
  return {
    itemCount,
    subtotal,
    deliveryFee: appliedDelivery,
    total: subtotal + appliedDelivery
  };
}

/**
 * Pure single-restaurant guard check
 */
export function canAddProductToCart(currentCartRestaurantId, currentCartItems, targetRestaurantId) {
  if (!Array.isArray(currentCartItems) || currentCartItems.length === 0 || !currentCartRestaurantId) {
    return { allowed: true };
  }
  if (String(currentCartRestaurantId) === String(targetRestaurantId)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: 'Savatchada boshqa restoran taomlari bor. Har bir buyurtma faqat bitta restoranga tegishli bo‘lishi kerak.'
  };
}

export function showToast(message, type = 'info') {
  if (typeof document === 'undefined') return;
  let container = document.getElementById('kaylfood-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'kaylfood-toast-container';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const variantClass =
    type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : '';
  toast.className = `toast-item animate-enter ${variantClass}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button type="button" aria-label="Yopish" style="color:#fff;opacity:0.8;font-weight:700;">✕</button>
  `;

  toast.querySelector('button')?.addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 4000);
}

export function getBasePath() {
  if (typeof window === 'undefined') return '';
  const path = window.location.pathname;
  if (
    path.includes('/customer/') ||
    path.includes('/restaurant-dashboard/') ||
    path.includes('/courier-dashboard/') ||
    path.includes('/admin/')
  ) {
    return '..';
  }
  return '.';
}
