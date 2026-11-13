/**
 * KaylFood — Super Admin Console Controller (Requirement 14)
 * - View, Add, Edit, Suspend/Activate restaurants
 * - View customers & couriers
 * - Manage orders & view all financial transactions (Cash / Card / Online)
 * - Manage food categories & platform settings
 * - Live search & filtering
 * - Test Telegram Channel A & Channel B notifications
 */
import { StorageService } from './storage.js';
import { TelegramClientService } from './telegram-service.js';
import { escapeHtml, formatDateTime, formatMoney, showToast } from './utils.js';

export function initAdminDashboard() {
  const kpiMount = document.getElementById('admin-kpis-mount');
  const searchInput = document.getElementById('admin-global-search');
  const restaurantsTbody = document.getElementById('admin-restaurants-tbody');
  const addRestForm = document.getElementById('admin-add-restaurant-form');
  const ordersTbody = document.getElementById('admin-orders-tbody');
  const transactionsTbody = document.getElementById('admin-transactions-tbody');
  const customersTbody = document.getElementById('admin-customers-tbody');
  const couriersTbody = document.getElementById('admin-couriers-tbody');
  const categoriesListEl = document.getElementById('admin-categories-list');
  const addCatForm = document.getElementById('admin-add-category-form');
  const settingsForm = document.getElementById('admin-settings-form');
  const testChannelABtn = document.getElementById('admin-test-channel-a-btn');
  const testChannelBBtn = document.getElementById('admin-test-channel-b-btn');
  const telegramTestOutput = document.getElementById('admin-telegram-test-output');

  let filterQuery = '';

  const renderAll = () => {
    const restaurants = StorageService.getRestaurants();
    const orders = StorageService.getOrders();
    const users = StorageService.getUsers();
    const couriers = StorageService.getCouriers();
    const categories = StorageService.getCategories();
    const settings = StorageService.getSettings();
    const q = filterQuery.trim().toLowerCase();

    const totalGmv = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalCash = orders
      .filter((o) => o.paymentMethod === 'cash' && o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalCard = orders
      .filter((o) => o.paymentMethod === 'card' && o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalOnline = orders
      .filter((o) => o.paymentMethod === 'online' && o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    if (kpiMount) {
      kpiMount.innerHTML = `
        <div class="kpi-card">
          <div class="kpi-label">Jami Restoranlar</div>
          <div class="kpi-value">${restaurants.length}</div>
          <div class="kpi-sub">Faol: ${restaurants.filter((r) => !r.suspended).length} ta</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Umumiy aylanma (GMV)</div>
          <div class="kpi-value">${formatMoney(totalGmv)}</div>
          <div class="kpi-sub">Jami buyurtmalar: ${orders.length} ta</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Naqd / Karta / Onlayn</div>
          <div style="font-size:0.84rem;font-family:var(--font-mono);margin-top:8px;line-height:1.5;">
            Naqd: ${formatMoney(totalCash)}<br/>
            Karta: ${formatMoney(totalCard)}<br/>
            Onlayn: ${formatMoney(totalOnline)}
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Foydalanuvchilar va Kuryerlar</div>
          <div class="kpi-value">${users.length} / ${couriers.length}</div>
          <div class="kpi-sub">Komissiya: ${settings.serviceCommissionPercent || 12}%</div>
        </div>
      `;
    }

    if (restaurantsTbody) {
      const filteredRests = restaurants.filter(
        (r) =>
          !q ||
          r.name.toLowerCase().includes(q) ||
          (r.address || '').toLowerCase().includes(q)
      );

      restaurantsTbody.innerHTML = filteredRests
        .map(
          (r) => `
          <tr>
            <td>
              <strong>${escapeHtml(r.name)}</strong>
              <div style="font-size:0.76rem;color:var(--text-muted);">${escapeHtml(r.address || '')}</div>
            </td>
            <td class="tabular-nums">★ ${Number(r.rating || 4.8).toFixed(1)}</td>
            <td class="num-col">${formatMoney(r.deliveryFee)}</td>
            <td class="num-col">${formatMoney(r.minOrder)}</td>
            <td>
              <span style="font-weight:600;color:${r.suspended ? 'var(--danger-red)' : 'var(--success-green-dark)'};">
                ${r.suspended ? 'To‘xtatilgan (Suspended)' : r.isOpen ? 'Ochiq' : 'Yopiq'}
              </span>
            </td>
            <td>
              <div style="display:flex;gap:6px;">
                <button type="button" class="btn btn-glass-white btn-sm" data-admin-toggle-open="${escapeHtml(r.id)}">
                  ${r.isOpen ? 'Yopish' : 'Ochish'}
                </button>
                <button
                  type="button"
                  class="btn ${r.suspended ? 'btn-glass-success' : 'btn-glass-danger'} btn-sm"
                  data-admin-suspend-rest="${escapeHtml(r.id)}"
                >
                  ${r.suspended ? 'Faollashtirish' : 'To‘xtatish'}
                </button>
              </div>
            </td>
          </tr>
        `
        )
        .join('');

      restaurantsTbody.querySelectorAll('[data-admin-toggle-open]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-admin-toggle-open');
          const updated = StorageService.getRestaurants().map((r) =>
            r.id === id ? { ...r, isOpen: !r.isOpen } : r
          );
          StorageService.saveRestaurants(updated);
          renderAll();
          showToast('Restoran ish holati o‘zgartirildi', 'info');
        });
      });

      restaurantsTbody.querySelectorAll('[data-admin-suspend-rest]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-admin-suspend-rest');
          const updated = StorageService.getRestaurants().map((r) =>
            r.id === id ? { ...r, suspended: !r.suspended } : r
          );
          StorageService.saveRestaurants(updated);
          renderAll();
          showToast('Restoran platformadagi faoliyati yangilandi', 'success');
        });
      });
    }

    if (ordersTbody) {
      const filteredOrders = orders.filter(
        (o) =>
          !q ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.restaurantName.toLowerCase().includes(q)
      );

      ordersTbody.innerHTML = filteredOrders
        .map(
          (ord) => `
          <tr>
            <td class="tabular-nums"><strong>#${escapeHtml(ord.orderNumber)}</strong></td>
            <td>${escapeHtml(ord.restaurantName)}</td>
            <td>${escapeHtml(ord.customerName)} (${escapeHtml(ord.customerPhone)})</td>
            <td>${ord.courier ? escapeHtml(ord.courier.fullName) : 'Tayinlanmagan'}</td>
            <td class="num-col"><strong>${formatMoney(ord.totalAmount)}</strong></td>
            <td><strong>${escapeHtml(ord.status)}</strong></td>
          </tr>
        `
        )
        .join('');
    }

    if (transactionsTbody) {
      transactionsTbody.innerHTML = orders
        .map((ord) => {
          const method = String(ord.paymentMethod || 'cash').toLowerCase();
          const cashVal = method === 'cash' ? ord.totalAmount : 0;
          const cardVal = method === 'card' ? ord.totalAmount : 0;
          const onlineVal = method === 'online' ? ord.totalAmount : 0;
          return `
            <tr>
              <td class="tabular-nums"><strong>#${escapeHtml(ord.orderNumber)}</strong></td>
              <td>${escapeHtml(ord.restaurantName)}</td>
              <td class="tabular-nums">${escapeHtml(formatDateTime(ord.createdAt))}</td>
              <td class="num-col">${formatMoney(ord.subtotal)}</td>
              <td class="num-col">${formatMoney(ord.deliveryFee)}</td>
              <td class="num-col">${formatMoney(cashVal)}</td>
              <td class="num-col">${formatMoney(cardVal)}</td>
              <td class="num-col">${formatMoney(onlineVal)}</td>
              <td class="num-col"><strong>${formatMoney(ord.totalAmount)}</strong></td>
            </tr>
          `;
        })
        .join('');
    }

    if (customersTbody) {
      customersTbody.innerHTML = users
        .map(
          (u) => `
          <tr>
            <td><strong>${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}</strong></td>
            <td class="tabular-nums">${escapeHtml(u.phone)}</td>
            <td>${escapeHtml(u.role.toUpperCase())}</td>
            <td class="num-col">${(u.savedAddresses || []).length} ta</td>
          </tr>
        `
        )
        .join('');
    }

    if (couriersTbody) {
      couriersTbody.innerHTML = couriers
        .map(
          (c) => `
          <tr>
            <td><strong>${escapeHtml(c.lastName)} ${escapeHtml(c.firstName)} ${escapeHtml(c.fatherName)}</strong></td>
            <td class="tabular-nums">${escapeHtml(c.phone)}</td>
            <td>${escapeHtml(c.vehicle)}</td>
            <td class="num-col">${c.completedDeliveries || 0}</td>
            <td class="num-col">${formatMoney(c.totalEarnings || 0)}</td>
          </tr>
        `
        )
        .join('');
    }

    if (categoriesListEl) {
      categoriesListEl.innerHTML = categories
        .filter((c) => c.slug !== 'all')
        .map(
          (cat) => `
          <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 12px;background:#fff;border:1px solid var(--border-hairline);border-radius:10px;">
            <strong style="font-size:0.85rem;">${escapeHtml(cat.name)}</strong>
            <button type="button" class="btn btn-glass-danger btn-sm" style="padding:3px 8px;min-height:26px;" data-del-cat="${escapeHtml(cat.slug)}">✕</button>
          </div>
        `
        )
        .join('');

      categoriesListEl.querySelectorAll('[data-del-cat]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const slug = btn.getAttribute('data-del-cat');
          const next = StorageService.getCategories().filter((c) => c.slug !== slug);
          StorageService.saveCategories(next);
          renderAll();
          showToast(`"${slug}" kategoriyasi o‘chirildi`, 'info');
        });
      });
    }

    if (settingsForm) {
      const pName = document.getElementById('adm-set-name');
      const pPhone = document.getElementById('adm-set-phone');
      const pComm = document.getElementById('adm-set-comm');
      if (pName) pName.value = settings.platformName || 'KaylFood';
      if (pPhone) pPhone.value = settings.supportPhone || '+998 71 200 00 07';
      if (pComm) pComm.value = settings.serviceCommissionPercent ?? 12;
    }
  };

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterQuery = e.target.value || '';
      renderAll();
    });
  }

  if (addRestForm) {
    addRestForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = String(document.getElementById('adm-rest-name')?.value || '').trim();
      const address = String(document.getElementById('adm-rest-address')?.value || '').trim();
      const category = String(document.getElementById('adm-rest-category')?.value || 'Burgers');
      const fee = Math.max(0, Number(document.getElementById('adm-rest-fee')?.value) || 15000);
      const minOrder = Math.max(0, Number(document.getElementById('adm-rest-min')?.value) || 50000);

      if (name.length < 2 || address.length < 4) {
        showToast('Restoran nomi va manzilini kiriting', 'error');
        return;
      }

      const list = StorageService.getRestaurants();
      list.unshift({
        id: `rest-${Date.now()}`,
        name,
        cuisine: `${category} · Milliy va Yevropa taomlari`,
        categories: [category, 'Drinks'],
        rating: 5.0,
        reviewCount: 1,
        deliveryTime: '25–35 daq',
        deliveryFee: fee,
        minOrder,
        isOpen: true,
        featured: true,
        recommended: true,
        openingHours: '09:00 – 23:00',
        address,
        description: `${name} — yangi qo‘shilgan hamkor restoran.`,
        couriers: ['cour-1', 'cour-2']
      });
      StorageService.saveRestaurants(list);
      addRestForm.reset();
      renderAll();
      showToast(`"${name}" restorani platformaga qo‘shildi!`, 'success');
    });
  }

  if (addCatForm) {
    addCatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = String(document.getElementById('adm-new-cat-name')?.value || '').trim();
      if (name.length < 2) return;
      const list = StorageService.getCategories();
      if (!list.some((c) => c.slug.toLowerCase() === name.toLowerCase())) {
        list.push({
          id: `cat-${Date.now()}`,
          name,
          slug: name
        });
        StorageService.saveCategories(list);
      }
      addCatForm.reset();
      renderAll();
      showToast(`"${name}" kategoriyasi qo‘shildi`, 'success');
    });
  }

  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const current = StorageService.getSettings();
      current.platformName = String(document.getElementById('adm-set-name')?.value || 'KaylFood').trim();
      current.supportPhone = String(document.getElementById('adm-set-phone')?.value || '').trim();
      current.serviceCommissionPercent = Number(document.getElementById('adm-set-comm')?.value) || 12;
      StorageService.saveSettings(current);
      renderAll();
      showToast('Platforma sozlamalari saqlandi!', 'success');
    });
  }

  if (testChannelABtn) {
    testChannelABtn.addEventListener('click', async () => {
      const sampleOrder = StorageService.getOrders()[0];
      if (!sampleOrder) return;
      try {
        const res = await TelegramClientService.sendOrderNotification(sampleOrder);
        if (telegramTestOutput) {
          telegramTestOutput.style.display = 'block';
          telegramTestOutput.textContent = res.payloadPreview || JSON.stringify(res, null, 2);
        }
        showToast('Kanal A (Asosiy buyurtmalar) xabarnomasi tekshirildi!', 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Xatolik', 'error');
      }
    });
  }

  if (testChannelBBtn) {
    testChannelBBtn.addEventListener('click', async () => {
      const sampleOrder = StorageService.getOrders()[0];
      if (!sampleOrder) return;
      try {
        const res = await TelegramClientService.sendFinanceNotification(sampleOrder);
        if (telegramTestOutput) {
          telegramTestOutput.style.display = 'block';
          telegramTestOutput.textContent = res.payloadPreview || JSON.stringify(res, null, 2);
        }
        showToast('Kanal B (Moliyaviy hisobot) xabarnomasi tekshirildi!', 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Xatolik', 'error');
      }
    });
  }

  renderAll();
}
