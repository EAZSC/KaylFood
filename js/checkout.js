/**
 * KaylFood — Checkout & Payment Controller (Requirement 7 & 11)
 * - Validates customer name, phone, delivery address, payment method
 * - Supports Cash, Bank card, Online payment with honest payment gateway interface
 * - Calls server-side /.netlify/functions/create-order to generate Channel A & Channel B notifications
 * - Displays Order Confirmation view with unique order number and tracking link
 */
import { StorageService } from './storage.js';
import { CartService } from './cart.js';
import { TelegramClientService } from './telegram-service.js';
import { NotificationCenter } from './notifications.js';
import {
  escapeHtml,
  formatMoney,
  generateOrderNumber,
  isValidUzbekPhone,
  showToast
} from './utils.js';

export function initCheckoutPage() {
  const user = StorageService.getCurrentUser();
  const summaryMount = document.getElementById('checkout-order-summary');
  const form = document.getElementById('checkout-form');
  const errorBox = document.getElementById('checkout-error');
  const savedAddrSelect = document.getElementById('checkout-saved-address');
  const detectLocBtn = document.getElementById('checkout-detect-location-btn');
  const confirmationSection = document.getElementById('checkout-confirmation-section');
  const checkoutMainGrid = document.getElementById('checkout-main-grid');
  const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
  const paymentGatewayNotice = document.getElementById('payment-gateway-notice');

  const nameInput = document.getElementById('checkout-name');
  const phoneInput = document.getElementById('checkout-phone');
  const addressInput = document.getElementById('checkout-address');
  const instructionsInput = document.getElementById('checkout-instructions');
  const coordsInput = document.getElementById('checkout-coords');

  if (user) {
    if (nameInput && !nameInput.value) {
      nameInput.value = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    if (phoneInput && !phoneInput.value) {
      phoneInput.value = user.phone || '';
    }
    if (savedAddrSelect && Array.isArray(user.savedAddresses) && user.savedAddresses.length > 0) {
      savedAddrSelect.innerHTML =
        `<option value="">Saqlangan manzilni tanlang...</option>` +
        user.savedAddresses
          .map(
            (a, idx) =>
              `<option value="${idx}" ${idx === 0 ? 'selected' : ''}>${escapeHtml(a.label)} — ${escapeHtml(a.address)}</option>`
          )
          .join('');
      if (addressInput && !addressInput.value) {
        addressInput.value = user.savedAddresses[0].address;
      }
      if (instructionsInput && !instructionsInput.value) {
        instructionsInput.value = user.savedAddresses[0].instructions || '';
      }
      savedAddrSelect.addEventListener('change', (e) => {
        const idx = Number(e.target.value);
        const chosen = user.savedAddresses[idx];
        if (chosen) {
          if (addressInput) addressInput.value = chosen.address;
          if (instructionsInput) instructionsInput.value = chosen.instructions || '';
        }
      });
    }
  }

  paymentRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      const selected = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cash';
      if (!paymentGatewayNotice) return;
      if (selected === 'cash') {
        paymentGatewayNotice.innerHTML = `
          <strong>Naqd pul orqali to‘lov:</strong> Buyurtmani kuryer yetkazib berganida naqd pulda to‘laysiz.
        `;
      } else if (selected === 'card') {
        paymentGatewayNotice.innerHTML = `
          <strong>Bank kartasi (UZCARD / HUMO / Visa):</strong> Kuryer maxsus POS-terminal bilan boradi yoki to‘lov provayderi ulanganda avto-yechiladi.
        `;
      } else {
        paymentGatewayNotice.innerHTML = `
          <strong>Onlayn to‘lov interfeysi (Payme / Click / Uzum):</strong> Haqiqiy karta yechimi uchun merchant ID integratsiyasi tayyorlangan. Buyurtma moliyaviy hisobotda "Onlayn to‘lov" sifatida qayd etiladi.
        `;
      }
    });
  });

  if (detectLocBtn && coordsInput) {
    detectLocBtn.addEventListener('click', () => {
      coordsInput.value = '41.3111, 69.2797 (Toshkent Markazi)';
      showToast('Joylashuv koordinatalari belgilandi', 'info');
    });
  }

  const renderSummary = () => {
    if (!summaryMount) return;
    const summary = CartService.getSummary();

    if (summary.items.length === 0) {
      summaryMount.innerHTML = `
        <div style="text-align:center;padding:28px 16px;">
          <p style="font-weight:700;margin-bottom:8px;">Savatchangiz bo‘sh</p>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:16px;">Buyurtma berish uchun avval restorandan taom tanlang.</p>
          <a href="index.html#restaurants-section" class="btn btn-glass-primary btn-sm">Restoranlarga qaytish</a>
        </div>
      `;
      return;
    }

    summaryMount.innerHTML = `
      <div style="padding-bottom:12px;border-bottom:1px solid var(--border-hairline);margin-bottom:14px;">
        <span style="font-size:0.78rem;color:var(--text-muted);display:block;">Tanlangan restoran</span>
        <strong style="font-size:1.05rem;color:var(--primary-navy);">${escapeHtml(summary.restaurantName)}</strong>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
        ${summary.items
          .map(
            (item) => `
          <div style="display:flex;justify-content:space-between;gap:10px;font-size:0.885rem;">
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              <span class="tabular-nums" style="color:var(--text-muted);"> × ${item.quantity}</span>
              <div style="font-size:0.76rem;color:var(--text-muted);">${escapeHtml(item.customization || '')}</div>
            </div>
            <strong class="tabular-nums">${formatMoney(item.unitPrice * item.quantity)}</strong>
          </div>
        `
          )
          .join('')}
      </div>

      <div style="border-top:1px solid var(--border-hairline);padding-top:12px;display:flex;flex-direction:column;gap:8px;font-size:0.9rem;">
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-secondary);">Taomlar summasi:</span>
          <strong class="tabular-nums">${formatMoney(summary.subtotal)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-secondary);">Yetkazib berish xizmati:</span>
          <strong class="tabular-nums">${formatMoney(summary.deliveryFee)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:1.08rem;padding-top:8px;border-top:1px solid var(--border-hairline);">
          <strong style="color:var(--primary-navy);">Jami to‘lov:</strong>
          <strong class="tabular-nums" style="color:var(--primary-navy);">${formatMoney(summary.total)}</strong>
        </div>
      </div>
    `;
  };

  window.addEventListener('kaylfood:cart-updated', renderSummary);
  renderSummary();

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorBox) errorBox.textContent = '';

      const summary = CartService.getSummary();
      if (summary.items.length === 0) {
        const msg = 'Savatchada mahsulot yo‘q. Avval taom qo‘shing.';
        if (errorBox) errorBox.textContent = msg;
        showToast(msg, 'error');
        return;
      }

      const customerName = String(nameInput?.value || '').trim();
      const customerPhone = String(phoneInput?.value || '').trim();
      const deliveryAddress = String(addressInput?.value || '').trim();
      const instructions = String(instructionsInput?.value || '').trim();
      const locationCoords = String(coordsInput?.value || '').trim();
      const paymentMethod =
        document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cash';

      if (customerName.length < 3) {
        const msg = 'Ism va familiyangizni to‘liq kiriting (kamida 3 ta belgi).';
        if (errorBox) errorBox.textContent = msg;
        showToast(msg, 'error');
        return;
      }

      if (!isValidUzbekPhone(customerPhone)) {
        const msg = 'Telefon raqamni to‘g‘ri kiriting (masalan: +998 90 123 45 67).';
        if (errorBox) errorBox.textContent = msg;
        showToast(msg, 'error');
        return;
      }

      if (deliveryAddress.length < 5) {
        const msg = 'Yetkazib berish manzilini to‘liq kiriting (kamida 5 ta belgi).';
        if (errorBox) errorBox.textContent = msg;
        showToast(msg, 'error');
        return;
      }

      const restaurant = StorageService.getRestaurantById(summary.restaurantId);
      const submitBtn = document.getElementById('checkout-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Buyurtma yuborilmoqda...';
      }

      const generatedNumber = generateOrderNumber();
      const requestPayload = {
        orderNumber: generatedNumber,
        restaurantId: summary.restaurantId,
        restaurantMeta: restaurant,
        customerName,
        customerPhone,
        deliveryAddress,
        instructions,
        locationCoords,
        paymentMethod,
        items: summary.items
      };

      try {
        const serverResponse = await TelegramClientService.createOrderAndNotify(requestPayload);
        const createdOrder = serverResponse.order;

        StorageService.upsertOrder(createdOrder);
        CartService.clearCart(true);

        NotificationCenter.push({
          type: 'new_order',
          title: `Buyurtma #${createdOrder.orderNumber} qabul qilindi`,
          message: `${createdOrder.restaurantName}ga buyurtma yuborildi. Telegram Kanal A va Kanal B xabarnomalari shakllantirildi.`,
          orderNumber: createdOrder.orderNumber
        });

        showToast(`Buyurtma #${createdOrder.orderNumber} muvaffaqiyatli rasmiylashtirildi!`, 'success');
        renderOrderConfirmation(
          checkoutMainGrid,
          confirmationSection,
          createdOrder,
          serverResponse.notifications
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Buyurtmani yuborishda xatolik.';
        if (errorBox) errorBox.textContent = errMsg;
        showToast(errMsg, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Buyurtmani tasdiqlash';
        }
      }
    });
  }
}

function renderOrderConfirmation(mainGrid, confirmEl, order, notifications) {
  if (mainGrid) mainGrid.style.display = 'none';
  if (!confirmEl) return;

  confirmEl.style.display = 'block';
  confirmEl.innerHTML = `
    <div class="hero-grid animate-enter" style="grid-template-columns:1fr;max-width:860px;margin:0 auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding-bottom:16px;border-bottom:1px solid var(--border-hairline);">
        <div>
          <span class="hero-kicker" style="color:var(--success-green-dark);">Buyurtma tasdiqlandi</span>
          <h2 style="font-size:1.75rem;margin-top:4px;">Buyurtma raqami: <span class="tabular-nums">#${escapeHtml(order.orderNumber)}</span></h2>
        </div>
        <a href="tracking.html?order=${encodeURIComponent(order.orderNumber)}" class="btn btn-glass-primary btn-lg">
          Buyurtmani jonli kuzatish
        </a>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;padding:12px 0;">
        <div class="kpi-card">
          <div class="kpi-label">Restoran</div>
          <div style="font-weight:700;font-size:1rem;margin-top:6px;">${escapeHtml(order.restaurantName)}</div>
          <div class="kpi-sub">Taxminiy vaqt: ${order.estimatedDeliveryMinutes || 35} daqiqa</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">To‘lov usuli va Jami</div>
          <div class="kpi-value">${formatMoney(order.totalAmount)}</div>
          <div class="kpi-sub">Usul: ${escapeHtml(order.paymentMethod.toUpperCase())}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Joriy holat</div>
          <div style="font-weight:700;font-size:1rem;color:var(--primary-blue);margin-top:6px;">${escapeHtml(order.status)}</div>
          <div class="kpi-sub">${escapeHtml(order.deliveryAddress)}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">
        <div style="padding:16px;background:#fff;border:1px solid var(--border-hairline);border-radius:12px;">
          <h4 style="font-size:0.9rem;margin-bottom:8px;color:var(--primary-navy);">Telegram Kanal A — Asosiy Buyurtmalar</h4>
          <pre style="white-space:pre-wrap;font-family:var(--font-mono);font-size:0.76rem;color:var(--text-secondary);background:var(--surface-muted);padding:12px;border-radius:8px;">${escapeHtml(notifications?.channelA_orders?.payloadPreview || '')}</pre>
        </div>
        <div style="padding:16px;background:#fff;border:1px solid var(--border-hairline);border-radius:12px;">
          <h4 style="font-size:0.9rem;margin-bottom:8px;color:var(--primary-navy);">Telegram Kanal B — Moliyaviy Hisobot</h4>
          <pre style="white-space:pre-wrap;font-family:var(--font-mono);font-size:0.76rem;color:var(--text-secondary);background:var(--surface-muted);padding:12px;border-radius:8px;">${escapeHtml(notifications?.channelB_finance?.payloadPreview || '')}</pre>
        </div>
      </div>
    </div>
  `;
}
