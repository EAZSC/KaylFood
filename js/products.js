/**
 * KaylFood — Food Products Rendering & Customization Modal
 * Strictly preserves <div class="product-image"><!-- ADD FOOD PRODUCT IMAGE HERE --></div>
 */
import { StorageService } from './storage.js';
import { getProductImageUrl } from './data.js';
import { CartService } from './cart.js';
import { escapeHtml, formatMoney } from './utils.js';

export function renderProductCardHtml(product, showRestaurantName = false) {
  const restaurant = showRestaurantName
    ? StorageService.getRestaurantById(product.restaurantId)
    : null;
  const imgUrl = getProductImageUrl(product);

  return `
    <article class="product-card" data-product-id="${escapeHtml(product.id)}">
      <div class="product-image">
        <!-- ADD FOOD PRODUCT IMAGE HERE -->
        <img
          src="${escapeHtml(imgUrl)}"
          alt="${escapeHtml(product.name)}"
          referrerpolicy="no-referrer"
          loading="lazy"
        />
      </div>
      <div class="product-category-kicker">
        ${escapeHtml(product.category)}${restaurant ? ` · ${escapeHtml(restaurant.name)}` : ''}
      </div>
      <h3 class="product-title">${escapeHtml(product.name)}</h3>
      <p class="product-desc">${escapeHtml(product.description || '')}</p>
      <div class="product-card-footer">
        <span class="product-price tabular-nums">${formatMoney(product.price)}</span>
        <div style="display:flex;gap:8px;">
          <button
            type="button"
            class="btn btn-glass-white btn-sm"
            data-customize-product="${escapeHtml(product.id)}"
            ${!product.available ? 'disabled' : ''}
          >
            Tanlash
          </button>
          <button
            type="button"
            class="btn btn-glass-primary btn-sm"
            data-quick-add-product="${escapeHtml(product.id)}"
            ${!product.available ? 'disabled' : ''}
          >
            ${product.available ? 'Savatchaga' : 'Tugagan'}
          </button>
        </div>
      </div>
    </article>
  `;
}

export function bindProductCardActions(containerEl) {
  if (!containerEl) return;

  containerEl.querySelectorAll('[data-quick-add-product]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const prodId = btn.getAttribute('data-quick-add-product');
      const product = StorageService.getProducts().find((p) => p.id === prodId);
      if (!product) return;
      const defaultCustom = product.customizations?.[0]?.label || 'Standart';
      const defaultExtra = product.customizations?.[0]?.extraPrice || 0;
      CartService.addItem(product, 1, defaultCustom, defaultExtra);
    });
  });

  containerEl.querySelectorAll('[data-customize-product]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const prodId = btn.getAttribute('data-customize-product');
      const product = StorageService.getProducts().find((p) => p.id === prodId);
      if (product) openProductCustomizationModal(product);
    });
  });
}

export function openProductCustomizationModal(product) {
  if (typeof document === 'undefined') return;
  let modal = document.getElementById('product-custom-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'product-custom-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  const options =
    Array.isArray(product.customizations) && product.customizations.length > 0
      ? product.customizations
      : [{ label: 'Standart porsiya', extraPrice: 0 }];

  let selectedIndex = 0;
  let quantity = 1;
  const imgUrl = getProductImageUrl(product);

  const updateComputedTotal = () => {
    const extra = Number(options[selectedIndex]?.extraPrice || 0);
    const total = (Number(product.price) + extra) * quantity;
    const priceEl = modal.querySelector('#modal-computed-price');
    const qtyEl = modal.querySelector('#modal-qty-val');
    if (priceEl) priceEl.textContent = formatMoney(total);
    if (qtyEl) qtyEl.textContent = `${quantity}`;
  };

  modal.innerHTML = `
    <div class="modal-card animate-enter" role="dialog" aria-modal="true" aria-labelledby="custom-modal-title">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px;">
        <div>
          <span class="product-category-kicker">${escapeHtml(product.category)}</span>
          <h3 id="custom-modal-title" style="font-size:1.25rem;">${escapeHtml(product.name)}</h3>
        </div>
        <button type="button" class="btn btn-glass-white btn-sm" id="close-custom-modal" aria-label="Yopish">✕</button>
      </div>

      <div class="product-image" style="margin-bottom:16px;">
        <!-- ADD FOOD PRODUCT IMAGE HERE -->
        <img
          src="${escapeHtml(imgUrl)}"
          alt="${escapeHtml(product.name)}"
          referrerpolicy="no-referrer"
        />
      </div>

      <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:16px;">
        ${escapeHtml(product.description || '')}
      </p>

      <div class="form-group">
        <label class="form-label">Tarkib va qo‘shimchalarni tanlang</label>
        <div style="display:flex;flex-direction:column;gap:8px;" id="custom-options-list">
          ${options
            .map(
              (opt, idx) => `
            <label style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1px solid var(--border-hairline);border-radius:10px;background:#fff;cursor:pointer;">
              <span style="display:flex;align-items:center;gap:10px;font-size:0.9rem;">
                <input type="radio" name="prod-custom-opt" value="${idx}" ${idx === 0 ? 'checked' : ''} />
                <span>${escapeHtml(opt.label)}</span>
              </span>
              <span class="tabular-nums" style="font-size:0.85rem;color:var(--text-secondary);">
                ${opt.extraPrice > 0 ? `+${formatMoney(opt.extraPrice)}` : 'Bepul'}
              </span>
            </label>
          `
            )
            .join('')}
        </div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding-top:14px;border-top:1px solid var(--border-hairline);margin-top:16px;">
        <div class="qty-stepper">
          <button type="button" class="qty-btn" id="modal-qty-dec" aria-label="Kamaytirish">−</button>
          <span class="tabular-nums" id="modal-qty-val" style="min-width:26px;text-align:center;font-weight:700;">1</span>
          <button type="button" class="qty-btn" id="modal-qty-inc" aria-label="Ko‘paytirish">+</button>
        </div>

        <button type="button" class="btn btn-glass-primary btn-lg" id="modal-confirm-add">
          <span>Savatchaga qo‘shish ·</span>
          <span class="tabular-nums" id="modal-computed-price">${formatMoney(product.price)}</span>
        </button>
      </div>
    </div>
  `;

  modal.classList.add('open');

  modal.querySelector('#close-custom-modal')?.addEventListener('click', () => {
    modal.classList.remove('open');
  });

  modal.querySelectorAll('input[name="prod-custom-opt"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      selectedIndex = Number(e.target.value) || 0;
      updateComputedTotal();
    });
  });

  modal.querySelector('#modal-qty-dec')?.addEventListener('click', () => {
    if (quantity > 1) {
      quantity -= 1;
      updateComputedTotal();
    }
  });

  modal.querySelector('#modal-qty-inc')?.addEventListener('click', () => {
    if (quantity < 25) {
      quantity += 1;
      updateComputedTotal();
    }
  });

  modal.querySelector('#modal-confirm-add')?.addEventListener('click', () => {
    const chosen = options[selectedIndex] || options[0];
    CartService.addItem(product, quantity, chosen.label, chosen.extraPrice);
    modal.classList.remove('open');
  });
}
