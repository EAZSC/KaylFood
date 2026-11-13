/**
 * KaylFood — Live Order Tracking Interface (Requirement 8)
 * Supports all 9 order statuses:
 * 1. Order received
 * 2. Restaurant confirmed
 * 3. Preparing food
 * 4. Ready for pickup
 * 5. Courier assigned
 * 6. Courier picked up the order
 * 7. On the way
 * 8. Delivered
 * 9. Cancelled
 */
import { StorageService } from './storage.js';
import { ORDER_STATUS_FLOW } from './data.js';
import { NotificationCenter } from './notifications.js';
import { escapeHtml, formatDateTime, formatMoney, showToast } from './utils.js';

const ACTIVE_STEPS = ORDER_STATUS_FLOW.filter((s) => s !== 'Cancelled');

export function initTrackingPage() {
  const params = new URLSearchParams(window.location.search);
  const requestedOrder = params.get('order') || StorageService.getActiveOrderNumber();
  const selectEl = document.getElementById('tracking-order-select');
  const nextStepBtn = document.getElementById('tracking-simulate-next-btn');
  const cancelBtn = document.getElementById('tracking-cancel-order-btn');

  let currentOrderNumber = requestedOrder;

  const populateSelector = () => {
    const orders = StorageService.getOrders();
    if (!orders.find((o) => o.orderNumber === currentOrderNumber) && orders.length > 0) {
      currentOrderNumber = orders[0].orderNumber;
    }
    if (selectEl) {
      selectEl.innerHTML = orders
        .map(
          (o) =>
            `<option value="${escapeHtml(o.orderNumber)}" ${o.orderNumber === currentOrderNumber ? 'selected' : ''}>#${escapeHtml(o.orderNumber)} — ${escapeHtml(o.restaurantName)} (${escapeHtml(o.status)})</option>`
        )
        .join('');
    }
  };

  const renderTrackingView = () => {
    const order = StorageService.getOrderByNumber(currentOrderNumber);
    const detailsMount = document.getElementById('tracking-details-mount');
    const timelineMount = document.getElementById('tracking-timeline-mount');

    if (!order || !detailsMount || !timelineMount) return;

    StorageService.setActiveOrderNumber(order.orderNumber);

    const courier = order.courier;
    const courierDisplayName = courier
      ? `${courier.lastName || ''} ${courier.firstName || ''} ${courier.fatherName || ''}`.trim()
      : 'Hali biriktirilmagan (Restoran kuryer tanlamoqda)';

    detailsMount.innerHTML = `
      <div class="kpi-grid" style="margin-bottom:20px;">
        <div class="kpi-card">
          <div class="kpi-label">Buyurtma raqami</div>
          <div class="kpi-value">#${escapeHtml(order.orderNumber)}</div>
          <div class="kpi-sub">${escapeHtml(formatDateTime(order.createdAt))}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Restoran</div>
          <div style="font-size:1.05rem;font-weight:700;color:var(--primary-navy);margin-top:6px;">${escapeHtml(order.restaurantName)}</div>
          <div class="kpi-sub">${escapeHtml(order.restaurantAddress || '')}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Biriktirilgan kuryer</div>
          <div style="font-size:0.98rem;font-weight:700;color:var(--primary-navy);margin-top:6px;">${escapeHtml(courierDisplayName)}</div>
          <div class="kpi-sub tabular-nums">${courier ? `Tel: ${escapeHtml(courier.phone)}` : 'Kuryer tayinlangach ko‘rinadi'}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Joriy holat va Vaqt</div>
          <div style="font-size:1.02rem;font-weight:700;color:${order.status === 'Cancelled' ? 'var(--danger-red)' : 'var(--primary-blue)'};margin-top:6px;">
            ${escapeHtml(order.status)}
          </div>
          <div class="kpi-sub">Taxminiy yetkazish: <strong class="tabular-nums">${order.estimatedDeliveryMinutes || 30} daq</strong></div>
        </div>
      </div>

      <div style="padding:18px;background:var(--surface-glass-strong);border:1px solid var(--border-hairline);border-radius:var(--radius-md);display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px;">
        <div>
          <span style="font-size:0.78rem;color:var(--text-muted);display:block;">Yetkazish manzili va mijoz</span>
          <strong>${escapeHtml(order.customerName)} (${escapeHtml(order.customerPhone)})</strong>
          <div style="font-size:0.875rem;color:var(--text-secondary);">${escapeHtml(order.deliveryAddress)}</div>
        </div>
        <div style="text-align:right;">
          <span style="font-size:0.78rem;color:var(--text-muted);display:block;">Buyurtma summasi (${escapeHtml(order.paymentMethod.toUpperCase())})</span>
          <strong class="tabular-nums" style="font-size:1.2rem;color:var(--primary-navy);">${formatMoney(order.totalAmount)}</strong>
        </div>
      </div>
    `;

    const currentStepIdx = ACTIVE_STEPS.indexOf(order.status);

    timelineMount.innerHTML = ACTIVE_STEPS.map((stepName, idx) => {
      let stateClass = '';
      if (order.status === 'Cancelled') {
        stateClass = '';
      } else if (idx < currentStepIdx || order.status === 'Delivered') {
        stateClass = 'completed';
      } else if (idx === currentStepIdx) {
        stateClass = 'current';
      }

      const historyEntry = (order.timeline || []).find((t) =>
        t.status.toLowerCase().includes(stepName.toLowerCase())
      );

      return `
        <div class="timeline-step ${stateClass}">
          <span class="timeline-index">${idx + 1}</span>
          <div style="flex:1;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
              <strong style="font-size:0.95rem;">${escapeHtml(stepName)}</strong>
              <span class="tabular-nums" style="font-size:0.78rem;color:var(--text-muted);">
                ${historyEntry ? escapeHtml(formatDateTime(historyEntry.timestamp)) : idx <= currentStepIdx ? 'Tasdiqlangan' : 'Kutilmoqda'}
              </span>
            </div>
            ${historyEntry?.actor ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:2px;">Mas’ul: ${escapeHtml(historyEntry.actor)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    if (order.status === 'Cancelled') {
      timelineMount.innerHTML += `
        <div class="timeline-step" style="border-color:var(--danger-red);background:rgba(254,242,242,0.9);">
          <span class="timeline-index" style="background:var(--danger-red);color:#fff;">9</span>
          <div>
            <strong style="color:var(--danger-red);">Cancelled (Buyurtma bekor qilingan)</strong>
          </div>
        </div>
      `;
    }
  };

  if (selectEl) {
    selectEl.addEventListener('change', (e) => {
      currentOrderNumber = e.target.value;
      renderTrackingView();
    });
  }

  if (nextStepBtn) {
    nextStepBtn.addEventListener('click', () => {
      const order = StorageService.getOrderByNumber(currentOrderNumber);
      if (!order) return;
      if (order.status === 'Delivered' || order.status === 'Cancelled') {
        showToast('Ushbu buyurtma yakunlangan.', 'info');
        return;
      }

      const idx = ACTIVE_STEPS.indexOf(order.status);
      const nextStatus = ACTIVE_STEPS[Math.min(idx + 1, ACTIVE_STEPS.length - 1)];
      order.status = nextStatus;

      // If transitioning to Courier assigned without a courier yet, attach default courier
      if (nextStatus === 'Courier assigned' && !order.courier) {
        const defaultCourier = StorageService.getCouriers()[0];
        if (defaultCourier) {
          order.courier = {
            id: defaultCourier.id,
            firstName: defaultCourier.firstName,
            lastName: defaultCourier.lastName,
            fatherName: defaultCourier.fatherName,
            fullName: `${defaultCourier.lastName} ${defaultCourier.firstName} ${defaultCourier.fatherName}`,
            phone: defaultCourier.phone,
            vehicle: defaultCourier.vehicle
          };
        }
      }

      order.timeline = Array.isArray(order.timeline) ? order.timeline : [];
      order.timeline.push({
        status: nextStatus,
        timestamp: new Date().toISOString(),
        actor: order.courier?.fullName || order.restaurantName
      });

      StorageService.upsertOrder(order);
      NotificationCenter.push({
        type: 'delivery_status',
        title: `Buyurtma #${order.orderNumber}: ${nextStatus}`,
        message: `Buyurtma holati "${nextStatus}" bosqichiga o‘tdi.`,
        orderNumber: order.orderNumber
      });

      populateSelector();
      renderTrackingView();
      showToast(`Holat yangilandi: ${nextStatus}`, 'success');
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      const order = StorageService.getOrderByNumber(currentOrderNumber);
      if (!order || order.status === 'Delivered') return;
      order.status = 'Cancelled';
      order.timeline = Array.isArray(order.timeline) ? order.timeline : [];
      order.timeline.push({
        status: 'Cancelled',
        timestamp: new Date().toISOString(),
        actor: 'Customer'
      });
      StorageService.upsertOrder(order);
      populateSelector();
      renderTrackingView();
      showToast(`Buyurtma #${order.orderNumber} bekor qilindi`, 'error');
    });
  }

  populateSelector();
  renderTrackingView();
}
