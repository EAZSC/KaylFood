/**
 * KaylFood — Orders & Customer Profile Controller
 */
import { StorageService } from './storage.js';
import { AuthService } from './auth.js';
import { CartService } from './cart.js';
import { escapeHtml, formatDateTime, formatMoney, showToast } from './utils.js';

export function initCustomerProfilePage() {
  const user = AuthService.getCurrentUser() || StorageService.getUsers()[0];
  const profileForm = document.getElementById('profile-edit-form');
  const addressForm = document.getElementById('profile-address-form');
  const addressesListEl = document.getElementById('saved-addresses-list');
  const ordersHistoryEl = document.getElementById('customer-order-history');
  const logoutBtn = document.getElementById('profile-logout-btn');

  if (profileForm && user) {
    const firstInput = document.getElementById('prof-first-name');
    const lastInput = document.getElementById('prof-last-name');
    const phoneInput = document.getElementById('prof-phone');
    if (firstInput) firstInput.value = user.firstName || '';
    if (lastInput) lastInput.value = user.lastName || '';
    if (phoneInput) phoneInput.value = user.phone || '';

    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const res = AuthService.updateProfile({
        firstName: firstInput?.value,
        lastName: lastInput?.value,
        phone: phoneInput?.value
      });
      if (!res.ok) {
        showToast(res.error, 'error');
        return;
      }
      showToast('Profil ma’lumotlari saqlandi', 'success');
    });
  }

  const renderSavedAddresses = () => {
    if (!addressesListEl) return;
    const current = AuthService.getCurrentUser() || user;
    const addresses = current?.savedAddresses || [];

    if (addresses.length === 0) {
      addressesListEl.innerHTML = `<p style="font-size:0.875rem;color:var(--text-muted);">Saqlangan manzillar yo‘q.</p>`;
      return;
    }

    addressesListEl.innerHTML = addresses
      .map(
        (addr) => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px;border:1px solid var(--border-hairline);border-radius:12px;background:#fff;">
          <div>
            <strong style="font-size:0.9rem;color:var(--primary-navy);">${escapeHtml(addr.label)}</strong>
            <div style="font-size:0.85rem;color:var(--text-secondary);">${escapeHtml(addr.address)}</div>
            ${addr.instructions ? `<div style="font-size:0.78rem;color:var(--text-muted);">Izoh: ${escapeHtml(addr.instructions)}</div>` : ''}
          </div>
          <button type="button" class="btn btn-glass-danger btn-sm" data-del-addr="${escapeHtml(addr.id)}">O‘chirish</button>
        </div>
      `
      )
      .join('');

    addressesListEl.querySelectorAll('[data-del-addr]').forEach((btn) => {
      btn.addEventListener('click', () => {
        AuthService.deleteSavedAddress(btn.getAttribute('data-del-addr'));
        renderSavedAddresses();
        showToast('Manzil o‘chirildi', 'info');
      });
    });
  };

  if (addressForm) {
    addressForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const label = document.getElementById('new-addr-label')?.value || '';
      const address = document.getElementById('new-addr-text')?.value || '';
      const instructions = document.getElementById('new-addr-note')?.value || '';

      const res = AuthService.addSavedAddress({ label, address, instructions });
      if (!res.ok) {
        showToast(res.error, 'error');
        return;
      }
      addressForm.reset();
      renderSavedAddresses();
      showToast('Yangi yetkazib berish manzili qo‘shildi', 'success');
    });
  }

  const renderOrderHistory = () => {
    if (!ordersHistoryEl) return;
    const orders = StorageService.getOrders();
    if (orders.length === 0) {
      ordersHistoryEl.innerHTML = `<p style="font-size:0.875rem;color:var(--text-muted);">Hozircha buyurtmalar tarixi mavjud emas.</p>`;
      return;
    }

    ordersHistoryEl.innerHTML = orders
      .map(
        (ord) => `
        <div style="padding:18px;border:1px solid var(--border-hairline);border-radius:14px;background:#fff;display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <div>
              <strong class="tabular-nums" style="color:var(--primary-navy);font-size:1rem;">#${escapeHtml(ord.orderNumber)}</strong>
              <span style="margin:0 6px;color:var(--text-muted);">·</span>
              <strong style="font-size:0.95rem;">${escapeHtml(ord.restaurantName)}</strong>
            </div>
            <span class="tabular-nums" style="font-size:0.8rem;color:var(--text-muted);">${escapeHtml(formatDateTime(ord.createdAt))}</span>
          </div>
          <div style="font-size:0.85rem;color:var(--text-secondary);">
            ${(ord.items || []).map((i) => `${escapeHtml(i.name)} (${i.quantity}x)`).join(', ')}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border-hairline);flex-wrap:wrap;gap:10px;">
            <div class="meta-inline">
              <span>Holati: <strong style="color:var(--primary-blue);">${escapeHtml(ord.status)}</strong></span>
              <span class="meta-sep">·</span>
              <span>Jami: <strong class="tabular-nums" style="color:var(--primary-navy);">${formatMoney(ord.totalAmount)}</strong></span>
            </div>
            <div style="display:flex;gap:8px;">
              <a href="../tracking.html?order=${encodeURIComponent(ord.orderNumber)}" class="btn btn-glass-primary btn-sm">
                Kuzatish
              </a>
              <button type="button" class="btn btn-glass-white btn-sm" data-reorder="${escapeHtml(ord.orderNumber)}">
                Qayta buyurtma
              </button>
            </div>
          </div>
        </div>
      `
      )
      .join('');

    ordersHistoryEl.querySelectorAll('[data-reorder]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ordNum = btn.getAttribute('data-reorder');
        const ord = StorageService.getOrderByNumber(ordNum);
        if (!ord) return;
        CartService.clearCart(true);
        const allProducts = StorageService.getProducts();
        for (const item of ord.items || []) {
          const found = allProducts.find((p) => p.id === item.productId);
          if (found) {
            CartService.addItem(found, item.quantity, item.customization, 0);
          }
        }
        window.location.href = '../checkout.html';
      });
    });
  };

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      AuthService.logout();
    });
  }

  renderSavedAddresses();
  renderOrderHistory();
}
