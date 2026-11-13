/**
 * KaylFood — Courier Dashboard Controller (Requirement 10 & 11)
 * - Courier identity with First name, Last name, Father's name, Phone number
 * - Assigned deliveries & New delivery requests
 * - Accept / Reject delivery
 * - Picked-up / On-the-way / Delivered status actions validated on server
 * - Delivery history & earnings overview
 */
import { StorageService } from './storage.js';
import { TelegramClientService } from './telegram-service.js';
import { NotificationCenter } from './notifications.js';
import { escapeHtml, formatDateTime, formatMoney, showToast } from './utils.js';

export function initCourierDashboard() {
  const courierSelect = document.getElementById('courier-dash-selector');
  const kpiMount = document.getElementById('courier-dash-kpis');
  const activeDeliveriesEl = document.getElementById('courier-active-deliveries');
  const historyTbody = document.getElementById('courier-history-tbody');
  const profileForm = document.getElementById('courier-profile-form');

  let activeCourierId = 'cour-1';

  const populateSelector = () => {
    const couriers = StorageService.getCouriers();
    if (!courierSelect) return;
    courierSelect.innerHTML = couriers
      .map(
        (c) =>
          `<option value="${escapeHtml(c.id)}" ${c.id === activeCourierId ? 'selected' : ''}>${escapeHtml(c.lastName)} ${escapeHtml(c.firstName)} ${escapeHtml(c.fatherName)} (${escapeHtml(c.phone)})</option>`
      )
      .join('');
  };

  const renderCourierWorkspace = () => {
    const courier = StorageService.getCourierById(activeCourierId);
    if (!courier) return;

    const allOrders = StorageService.getOrders();
    const myAssignedOrders = allOrders.filter(
      (o) =>
        (o.courier && o.courier.id === activeCourierId) ||
        o.status === 'Ready for pickup'
    );

    const activeList = myAssignedOrders.filter(
      (o) => !['Delivered', 'Cancelled'].includes(o.status)
    );
    const completedList = allOrders.filter(
      (o) => o.status === 'Delivered' && (!o.courier || o.courier.id === activeCourierId)
    );

    const sessionEarned = completedList.reduce(
      (sum, o) => sum + (Number(o.deliveryFee) || 15000),
      0
    );
    const totalEarned = (Number(courier.totalEarnings) || 0) + sessionEarned;

    if (kpiMount) {
      kpiMount.innerHTML = `
        <div class="kpi-card">
          <div class="kpi-label">Kuryer F.I.Sh.</div>
          <div style="font-size:1rem;font-weight:700;color:var(--primary-navy);margin-top:6px;">
            ${escapeHtml(courier.lastName)} ${escapeHtml(courier.firstName)} ${escapeHtml(courier.fatherName)}
          </div>
          <div class="kpi-sub tabular-nums">${escapeHtml(courier.phone)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Faol buyurtmalar</div>
          <div class="kpi-value">${activeList.length}</div>
          <div class="kpi-sub">Transport: ${escapeHtml(courier.vehicle)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Yetkazilgan buyurtmalar</div>
          <div class="kpi-value">${(courier.completedDeliveries || 0) + completedList.length}</div>
          <div class="kpi-sub">100% o‘z vaqtida</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Umumiy daromad</div>
          <div class="kpi-value">${formatMoney(totalEarned)}</div>
          <div class="kpi-sub">Har bir yetkazishdan 100% tarif</div>
        </div>
      `;
    }

    if (profileForm) {
      const fName = document.getElementById('cour-first-name');
      const lName = document.getElementById('cour-last-name');
      const mName = document.getElementById('cour-father-name');
      const phone = document.getElementById('cour-phone');
      if (fName) fName.value = courier.firstName || '';
      if (lName) lName.value = courier.lastName || '';
      if (mName) mName.value = courier.fatherName || '';
      if (phone) phone.value = courier.phone || '';
    }

    if (activeDeliveriesEl) {
      if (activeList.length === 0) {
        activeDeliveriesEl.innerHTML = `
          <div style="padding:32px;text-align:center;color:var(--text-muted);background:#fff;border:1px solid var(--border-hairline);border-radius:14px;">
            Hozircha yangi yetkazib berish so‘rovlari yo‘q. Restoran kuryer biriktirishi bilan shu yerda ko‘rinadi.
          </div>
        `;
      } else {
        activeDeliveriesEl.innerHTML = activeList
          .map(
            (ord) => `
            <div style="padding:20px;background:#fff;border:1px solid var(--border-hairline);border-radius:16px;display:flex;flex-direction:column;gap:14px;box-shadow:var(--shadow-glass);">
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding-bottom:12px;border-bottom:1px solid var(--border-hairline);">
                <div>
                  <span style="font-size:0.75rem;color:var(--primary-blue);font-weight:700;">Yetkazib berish topshirig‘i</span>
                  <h3 class="tabular-nums" style="font-size:1.2rem;">#${escapeHtml(ord.orderNumber)} · ${escapeHtml(ord.restaurantName)}</h3>
                </div>
                <span style="font-weight:700;color:var(--primary-navy);font-size:0.9rem;">Holat: ${escapeHtml(ord.status)}</span>
              </div>

              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;font-size:0.875rem;">
                <div>
                  <span style="color:var(--text-muted);display:block;font-size:0.76rem;">1. Olib ketish manzili (Restoran)</span>
                  <strong>${escapeHtml(ord.restaurantName)}</strong>
                  <div>${escapeHtml(ord.restaurantAddress || 'Toshkent sh.')}</div>
                </div>
                <div>
                  <span style="color:var(--text-muted);display:block;font-size:0.76rem;">2. Mijoz va Yetkazish manzili</span>
                  <strong>${escapeHtml(ord.customerName)} (${escapeHtml(ord.customerPhone)})</strong>
                  <div>${escapeHtml(ord.deliveryAddress)}</div>
                  ${ord.instructions ? `<div style="color:var(--primary-blue);font-size:0.8rem;">Izoh: ${escapeHtml(ord.instructions)}</div>` : ''}
                </div>
                <div>
                  <span style="color:var(--text-muted);display:block;font-size:0.76rem;">3. To‘lov va Yetkazish haqi</span>
                  <div>Yetkazish haqi: <strong class="tabular-nums">${formatMoney(ord.deliveryFee)}</strong></div>
                  <div>Jami buyurtma: <strong class="tabular-nums">${formatMoney(ord.totalAmount)} (${escapeHtml(ord.paymentMethod.toUpperCase())})</strong></div>
                </div>
              </div>

              <div style="display:flex;flex-wrap:wrap;gap:8px;padding-top:12px;border-top:1px solid var(--border-hairline);">
                <button type="button" class="btn btn-glass-success btn-sm" data-courier-act="accept" data-order="${escapeHtml(ord.orderNumber)}">
                  Qabul qilish (Accept)
                </button>
                <button type="button" class="btn btn-glass-danger btn-sm" data-courier-act="reject" data-order="${escapeHtml(ord.orderNumber)}">
                  Rad etish (Reject)
                </button>
                <button type="button" class="btn btn-glass-white btn-sm" data-courier-act="picked_up" data-order="${escapeHtml(ord.orderNumber)}">
                  Olib ketildi (Picked up)
                </button>
                <button type="button" class="btn btn-glass-primary btn-sm" data-courier-act="on_the_way" data-order="${escapeHtml(ord.orderNumber)}">
                  Yo‘lda (On the way)
                </button>
                <button type="button" class="btn btn-glass-success btn-sm" data-courier-act="delivered" data-order="${escapeHtml(ord.orderNumber)}">
                  Yetkazib berildi (Delivered)
                </button>
              </div>
            </div>
          `
          )
          .join('');

        activeDeliveriesEl.querySelectorAll('[data-courier-act]').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const action = btn.getAttribute('data-courier-act');
            const orderNumber = btn.getAttribute('data-order');
            const order = StorageService.getOrderByNumber(orderNumber);
            if (!order) return;

            // Ensure this courier is attached if accepting a Ready for pickup order
            if (!order.courier) {
              order.courier = {
                id: courier.id,
                firstName: courier.firstName,
                lastName: courier.lastName,
                fatherName: courier.fatherName,
                fullName: `${courier.lastName} ${courier.firstName} ${courier.fatherName}`,
                phone: courier.phone,
                vehicle: courier.vehicle
              };
            }

            try {
              const res = await TelegramClientService.submitCourierAction({
                orderNumber,
                courierId: courier.id,
                action,
                order,
                courierMeta: courier
              });

              order.status = res.status;
              order.courier = res.courier;
              order.timeline = res.timeline || order.timeline;
              StorageService.upsertOrder(order);

              NotificationCenter.push({
                type: 'courier_status',
                title: `Kuryer yangilashi (#${order.orderNumber})`,
                message: `${courier.lastName} ${courier.firstName} buyurtma holatini "${order.status}" ga o‘zgartirdi.`,
                orderNumber: order.orderNumber
              });

              showToast(`Buyurtma #${orderNumber}: ${order.status}`, 'success');
              renderCourierWorkspace();
            } catch (err) {
              showToast(err instanceof Error ? err.message : 'Xatolik', 'error');
            }
          });
        });
      }
    }

    if (historyTbody) {
      const historyRows = allOrders.filter((o) => o.status === 'Delivered');
      if (historyRows.length === 0) {
        historyTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;">Yakunlangan yetkazishlar hozircha yo‘q.</td></tr>`;
      } else {
        historyTbody.innerHTML = historyRows
          .map(
            (ord) => `
            <tr>
              <td class="tabular-nums"><strong>#${escapeHtml(ord.orderNumber)}</strong></td>
              <td>${escapeHtml(ord.restaurantName)}</td>
              <td>${escapeHtml(ord.customerName)} · ${escapeHtml(ord.deliveryAddress)}</td>
              <td class="num-col">${formatMoney(ord.deliveryFee)}</td>
              <td><span style="color:var(--success-green-dark);font-weight:600;">Yetkazilgan</span></td>
            </tr>
          `
          )
          .join('');
      }
    }
  };

  if (courierSelect) {
    courierSelect.addEventListener('change', (e) => {
      activeCourierId = e.target.value;
      renderCourierWorkspace();
    });
  }

  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const firstName = String(document.getElementById('cour-first-name')?.value || '').trim();
      const lastName = String(document.getElementById('cour-last-name')?.value || '').trim();
      const fatherName = String(document.getElementById('cour-father-name')?.value || '').trim();
      const phone = String(document.getElementById('cour-phone')?.value || '').trim();

      if (!firstName || !lastName || !fatherName || !phone) {
        showToast('Ism, familiya, otasining ismi va telefon raqam to‘liq kiritilishi shart.', 'error');
        return;
      }

      const list = StorageService.getCouriers().map((c) =>
        c.id === activeCourierId ? { ...c, firstName, lastName, fatherName, phone } : c
      );
      StorageService.saveCouriers(list);
      populateSelector();
      renderCourierWorkspace();
      showToast('Kuryer shaxsiy ma’lumotlari yangilandi!', 'success');
    });
  }

  populateSelector();
  renderCourierWorkspace();
}
