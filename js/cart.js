/**
 * KaylFood — Shopping Cart Manager (Requirement 5)
 * - Add / remove products
 * - Increase / decrease quantity
 * - Calculate subtotal, delivery fee, total
 * - Show selected restaurant
 * - Prevent mixing products from different restaurants in one order
 * - Clear cart
 */
import { StorageService } from './storage.js';
import {
  calculateCartTotals,
  canAddProductToCart,
  escapeHtml,
  formatMoney,
  getBasePath,
  showToast
} from './utils.js';

export const CartService = {
  getCart() {
    return StorageService.getCart();
  },

  getSummary() {
    const cart = this.getCart();
    const restaurant = cart.restaurantId
      ? StorageService.getRestaurantById(cart.restaurantId)
      : null;
    const deliveryFee = restaurant ? restaurant.deliveryFee : 0;
    const totals = calculateCartTotals(cart.items, deliveryFee);
    return {
      restaurantId: cart.restaurantId,
      restaurantName: restaurant?.name || cart.restaurantName || '',
      minOrder: restaurant?.minOrder || 0,
      items: cart.items || [],
      ...totals
    };
  },

  addItem(product, quantity = 1, customization = '', modifierExtra = 0) {
    if (!product || !product.id) return { ok: false, error: 'Mahsulot topilmadi.' };
    const restaurant = StorageService.getRestaurantById(product.restaurantId);
    if (!restaurant) return { ok: false, error: 'Restoran topilmadi.' };

    const cart = this.getCart();
    const check = canAddProductToCart(cart.restaurantId, cart.items, product.restaurantId);

    if (!check.allowed) {
      this.openRestaurantConflictModal(product, quantity, customization, modifierExtra);
      return { ok: false, conflict: true, error: check.reason };
    }

    const unitPrice = Number(product.price) + Number(modifierExtra || 0);
    const key = `${product.id}::${customization || 'default'}`;
    const existingIndex = cart.items.findIndex((i) => i.cartKey === key);

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += Math.max(1, Number(quantity) || 1);
    } else {
      cart.items.push({
        cartKey: key,
        productId: product.id,
        restaurantId: product.restaurantId,
        name: product.name,
        unitPrice,
        modifierExtra: Number(modifierExtra || 0),
        customization: customization || 'Standart',
        quantity: Math.max(1, Number(quantity) || 1)
      });
    }

    cart.restaurantId = restaurant.id;
    cart.restaurantName = restaurant.name;
    StorageService.saveCart(cart);
    this.refreshUI();
    showToast(`"${product.name}" savatchaga qo‘shildi`, 'success');
    return { ok: true };
  },

  updateQuantity(cartKey, delta) {
    const cart = this.getCart();
    const idx = cart.items.findIndex((i) => i.cartKey === cartKey);
    if (idx === -1) return;

    cart.items[idx].quantity += delta;
    if (cart.items[idx].quantity <= 0) {
      cart.items.splice(idx, 1);
    }
    if (cart.items.length === 0) {
      cart.restaurantId = null;
      cart.restaurantName = '';
    }

    StorageService.saveCart(cart);
    this.refreshUI();
  },

  removeItem(cartKey) {
    const cart = this.getCart();
    cart.items = cart.items.filter((i) => i.cartKey !== cartKey);
    if (cart.items.length === 0) {
      cart.restaurantId = null;
      cart.restaurantName = '';
    }
    StorageService.saveCart(cart);
    this.refreshUI();
    showToast('Mahsulot savatchadan olib tashlandi', 'info');
  },

  clearCart(silent = false) {
    StorageService.saveCart({
      restaurantId: null,
      restaurantName: '',
      items: []
    });
    this.refreshUI();
    if (!silent) {
      showToast('Savatcha tozalandi', 'info');
    }
  },

  openRestaurantConflictModal(product, quantity, customization, modifierExtra) {
    if (typeof document === 'undefined') return;
    let modal = document.getElementById('cart-conflict-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'cart-conflict-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const currentCart = this.getCart();
    const newRest = StorageService.getRestaurantById(product.restaurantId);

    modal.innerHTML = `
      <div class="modal-card animate-enter" role="dialog" aria-modal="true" aria-labelledby="conflict-title">
        <h3 id="conflict-title" style="font-size:1.2rem;margin-bottom:10px;">Boshqa restorandan buyurtma</h3>
        <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:18px;">
          Savatchangizda hozir <strong>${escapeHtml(currentCart.restaurantName)}</strong> restoranining taomlari bor.
          Har bir restoran yetkazib berishni mustaqil amalga oshirgani sababli, bitta buyurtmada faqat bitta restoran taomlari bo‘lishi mumkin.
          Savatchani tozalab, <strong>${escapeHtml(newRest?.name || '')}</strong> taomini qo‘shamizmi?
        </p>
        <div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;">
          <button type="button" class="btn btn-glass-white" id="conflict-cancel-btn">Bekor qilish</button>
          <button type="button" class="btn btn-glass-danger" id="conflict-replace-btn">Savatchani yangilash</button>
        </div>
      </div>
    `;

    modal.classList.add('open');

    modal.querySelector('#conflict-cancel-btn')?.addEventListener('click', () => {
      modal.classList.remove('open');
    });

    modal.querySelector('#conflict-replace-btn')?.addEventListener('click', () => {
      this.clearCart(true);
      modal.classList.remove('open');
      this.addItem(product, quantity, customization, modifierExtra);
    });
  },

  refreshUI() {
    if (typeof document === 'undefined') return;
    const summary = this.getSummary();

    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = `${summary.itemCount}`;
    });

    this.renderCartDrawer(summary);
    window.dispatchEvent(new CustomEvent('kaylfood:cart-updated', { detail: summary }));
  },

  renderCartDrawer(summary = this.getSummary()) {
    const bodyEl = document.getElementById('cart-drawer-body');
    const footerEl = document.getElementById('cart-drawer-footer');
    if (!bodyEl || !footerEl) return;

    const base = getBasePath();

    if (summary.items.length === 0) {
      bodyEl.innerHTML = `
        <div style="text-align:center;padding:48px 16px;color:var(--text-muted);">
          <p style="font-size:1.05rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">Savatchangiz bo‘sh</p>
          <p style="font-size:0.875rem;margin-bottom:20px;">Restoranlar menyusidan sevimli taomlaringizni tanlang.</p>
          <a href="${base}/index.html#restaurants-section" class="btn btn-glass-primary btn-sm" data-close-drawers>Restoranlarni ko‘rish</a>
        </div>
      `;
      footerEl.innerHTML = '';
      return;
    }

    bodyEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--surface-muted);border-radius:12px;">
        <div>
          <span style="font-size:0.75rem;color:var(--text-muted);display:block;">Tanlangan restoran</span>
          <strong style="font-size:0.925rem;color:var(--primary-navy);">${escapeHtml(summary.restaurantName)}</strong>
        </div>
        <button type="button" class="btn btn-glass-danger btn-sm" id="drawer-clear-cart-btn">Tozalash</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${summary.items
          .map(
            (item) => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--border-hairline);border-radius:12px;background:#fff;">
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;font-size:0.9rem;color:var(--text-primary);">${escapeHtml(item.name)}</div>
              <div style="font-size:0.78rem;color:var(--text-muted);">${escapeHtml(item.customization || 'Standart')}</div>
              <div class="tabular-nums" style="font-size:0.84rem;font-weight:600;color:var(--primary-navy);margin-top:4px;">
                ${formatMoney(item.unitPrice * item.quantity)}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <div class="qty-stepper">
                <button type="button" class="qty-btn" data-cart-dec="${escapeHtml(item.cartKey)}" aria-label="Kamaytirish">−</button>
                <span class="tabular-nums" style="min-width:20px;text-align:center;font-size:0.85rem;font-weight:700;">${item.quantity}</span>
                <button type="button" class="qty-btn" data-cart-inc="${escapeHtml(item.cartKey)}" aria-label="Ko‘paytirish">+</button>
              </div>
              <button type="button" class="btn btn-glass-danger btn-sm" data-cart-rm="${escapeHtml(item.cartKey)}" aria-label="O‘chirish">✕</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    footerEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:6px;font-size:0.875rem;">
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-secondary);">Taomlar summasi:</span>
          <strong class="tabular-nums">${formatMoney(summary.subtotal)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-secondary);">Yetkazib berish:</span>
          <strong class="tabular-nums">${formatMoney(summary.deliveryFee)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:1rem;padding-top:8px;border-top:1px solid var(--border-hairline);">
          <strong style="color:var(--primary-navy);">Jami to‘lov:</strong>
          <strong class="tabular-nums" style="color:var(--primary-navy);">${formatMoney(summary.total)}</strong>
        </div>
      </div>
      <a href="${base}/checkout.html" class="btn btn-glass-primary btn-block btn-lg">
        Buyurtmani rasmiylashtirish
      </a>
    `;

    bodyEl.querySelector('#drawer-clear-cart-btn')?.addEventListener('click', () => {
      this.clearCart();
    });

    bodyEl.querySelectorAll('[data-cart-dec]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.updateQuantity(btn.getAttribute('data-cart-dec'), -1);
      });
    });

    bodyEl.querySelectorAll('[data-cart-inc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.updateQuantity(btn.getAttribute('data-cart-inc'), 1);
      });
    });

    bodyEl.querySelectorAll('[data-cart-rm]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.removeItem(btn.getAttribute('data-cart-rm'));
      });
    });
  }
};
