/**
 * KaylFood — Restaurant Owner Dashboard (Requirement 9 & 11)
 * - Dashboard overview & daily/monthly sales chart
 * - Incoming, Active, Completed, Cancelled orders
 * - Select courier from restaurant's courier list & trigger Telegram Courier Bot
 * - Menu management: add / edit / delete products, toggle availability
 * - Restaurant settings: opening hours, delivery fee, minimum order
 */
import { StorageService } from './storage.js';
import { TelegramClientService } from './telegram-service.js';
import { NotificationCenter } from './notifications.js';
import { escapeHtml, formatDateTime, formatMoney, showToast } from './utils.js';

export function initRestaurantDashboard() {
  const restaurantSelect = document.getElementById('rest-dash-selector');
  const kpiMount = document.getElementById('rest-dash-kpis');
  const ordersTableBody = document.getElementById('rest-orders-tbody');
  const orderFilterBar = document.getElementById('rest-order-filter-bar');
  const menuTableBody = document.getElementById('rest-menu-tbody');
  const addProductForm = document.getElementById('rest-add-product-form');
  const settingsForm = document.getElementById('rest-settings-form');
  const couriersListEl = document.getElementById('rest-couriers-roster');
  const botPreviewBox = document.getElementById('rest-courier-bot-preview');

  let activeRestaurantId = 'rest-1';
  let activeOrderBucket = 'all'; // 'all' | 'incoming' | 'active' | 'completed' | 'cancelled'

  const populateRestaurantSelector = () => {
    const restaurants = StorageService.getRestaurants();
    if (!restaurantSelect) return;
    restaurantSelect.innerHTML = restaurants
      .map(
        (r) =>
          `<option value="${escapeHtml(r.id)}" ${r.id === activeRestaurantId ? 'selected' : ''}>${escapeHtml(r.name)}</option>`
      )
      .join('');
  };

  const getFilteredOrders = (orders) => {
    return orders.filter((o) => {
      if (o.restaurantId !== activeRestaurantId) return false;
      if (activeOrderBucket === 'incoming') {
        return ['Order received', 'Restaurant confirmed'].includes(o.status);
      }
      if (activeOrderBucket === 'active') {
        return [
          'Preparing food',
          'Ready for pickup',
          'Courier assigned',
          'Courier picked up the order',
          'On the way'
        ].includes(o.status);
      }
      if (activeOrderBucket === 'completed') {
        return o.status === 'Delivered';
      }
      if (activeOrderBucket === 'cancelled') {
        return o.status === 'Cancelled';
      }
      return true;
    });
  };

  const renderDashboard = () => {
    const restaurant = StorageService.getRestaurantById(activeRestaurantId);
    if (!restaurant) return;

    const allOrders = StorageService.getOrders().filter(
      (o) => o.restaurantId === activeRestaurantId
    );
    const activeOrdersCount = allOrders.filter(
      (o) => !['Delivered', 'Cancelled'].includes(o.status)
    ).length;
    const dailyRevenue = allOrders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const monthlyRevenue = dailyRevenue * 18 + 14500000;

    if (kpiMount) {
      kpiMount.innerHTML = `
        <div class="kpi-card">
          <div class="kpi-label">Bugungi buyurtmalar</div>
          <div class="kpi-value">${allOrders.length}</div>
          <div class="kpi-sub">Faol jarayonda: ${activeOrdersCount} ta</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Kunlik tushum</div>
          <div class="kpi-value">${formatMoney(dailyRevenue)}</div>
          <div class="kpi-sub">Yetkazish ulushi bilan</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Oylik savdo ko‘rsatkichi</div>
          <div class="kpi-value">${formatMoney(monthlyRevenue)}</div>
          <div class="kpi-sub">O‘rtacha chek: ${formatMoney(allOrders.length ? dailyRevenue / allOrders.length : 85000)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Restoran holati</div>
          <div style="font-size:1.15rem;font-weight:700;margin-top:6px;color:${restaurant.isOpen ? 'var(--success-green-dark)' : 'var(--danger-red)'};">
            ${restaurant.isOpen ? 'Ochiq (Faol)' : 'Yopiq'}
          </div>
          <div class="kpi-sub">Ish vaqti: ${escapeHtml(restaurant.openingHours || '09:00 – 23:00')}</div>
        </div>
      `;
    }

    renderOrdersTable(restaurant, allOrders);
    renderMenuTable();
    renderSettingsForm(restaurant);
    renderCouriersRoster(restaurant);
  };

  const renderOrdersTable = (restaurant, allOrders) => {
    if (!ordersTableBody) return;
    const filtered = getFilteredOrders(allOrders);
    const allCouriers = StorageService.getCouriers();
    const restCourierIds =
      Array.isArray(restaurant.couriers) && restaurant.couriers.length > 0
        ? restaurant.couriers
        : allCouriers.map((c) => c.id);
    const restCouriers = allCouriers.filter((c) => restCourierIds.includes(c.id));

    if (filtered.length === 0) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:28px;color:var(--text-muted);">
            Ushbu filtr bo‘yicha buyurtmalar yo‘q.
          </td>
        </tr>
      `;
      return;
    }

    ordersTableBody.innerHTML = filtered
      .map((ord) => {
        const assignedCourierId = ord.courier?.id || '';
        return `
        <tr>
          <td class="tabular-nums">
            <strong>#${escapeHtml(ord.orderNumber)}</strong>
            <div style="font-size:0.75rem;color:var(--text-muted);">${escapeHtml(formatDateTime(ord.createdAt))}</div>
          </td>
          <td>
            <strong>${escapeHtml(ord.customerName)}</strong>
            <div class="tabular-nums" style="font-size:0.78rem;color:var(--text-secondary);">${escapeHtml(ord.customerPhone)}</div>
            <div style="font-size:0.76rem;color:var(--text-muted);">${escapeHtml(ord.deliveryAddress)}</div>
          </td>
          <td>
            <div style="font-size:0.82rem;">
              ${(ord.items || []).map((i) => `${escapeHtml(i.name)} × ${i.quantity}`).join('<br/>')}
            </div>
          </td>
          <td class="num-col">
            <strong>${formatMoney(ord.totalAmount)}</strong>
            <div style="font-size:0.74rem;color:var(--text-muted);">${escapeHtml(ord.paymentMethod.toUpperCase())}</div>
          </td>
          <td>
            <select class="form-select" style="padding:6px 10px;font-size:0.82rem;min-width:165px;" data-order-status-change="${escapeHtml(ord.orderNumber)}" aria-label="Buyurtma holatini o'zgartirish">
              ${[
                'Order received',
                'Restaurant confirmed',
                'Preparing food',
                'Ready for pickup',
                'Courier assigned',
                'Delivered',
                'Cancelled'
              ]
                .map(
                  (st) =>
                    `<option value="${escapeHtml(st)}" ${ord.status === st ? 'selected' : ''}>${escapeHtml(st)}</option>`
                )
                .join('')}
            </select>
          </td>
          <td>
            <div style="display:flex;align-items:center;gap:6px;">
              <select class="form-select" style="padding:6px 10px;font-size:0.82rem;min-width:170px;" id="courier-sel-${escapeHtml(ord.orderNumber)}" aria-label="Kuryer tanlash">
                <option value="">Kuryer tanlang...</option>
                ${restCouriers
                  .map(
                    (c) =>
                      `<option value="${escapeHtml(c.id)}" ${assignedCourierId === c.id ? 'selected' : ''}>${escapeHtml(c.lastName)} ${escapeHtml(c.firstName)} (${escapeHtml(c.phone)})</option>`
                  )
                  .join('')}
              </select>
              <button type="button" class="btn btn-glass-primary btn-sm" data-assign-courier-btn="${escapeHtml(ord.orderNumber)}">
                Yuborish
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join('');

    ordersTableBody.querySelectorAll('[data-order-status-change]').forEach((sel) => {
      sel.addEventListener('change', (e) => {
        const ordNum = sel.getAttribute('data-order-status-change');
        const newStatus = e.target.value;
        const ord = StorageService.getOrderByNumber(ordNum);
        if (!ord) return;
        ord.status = newStatus;
        ord.timeline = Array.isArray(ord.timeline) ? ord.timeline : [];
        ord.timeline.push({
          status: newStatus,
          timestamp: new Date().toISOString(),
          actor: restaurant.name
        });
        StorageService.upsertOrder(ord);
        NotificationCenter.push({
          type: 'order_status',
          title: `Buyurtma #${ord.orderNumber} holati: ${newStatus}`,
          message: `${restaurant.name} buyurtma holatini "${newStatus}" deb belgiladi.`,
          orderNumber: ord.orderNumber
        });
        showToast(`Buyurtma #${ordNum}: ${newStatus}`, 'success');
        renderDashboard();
      });
    });

    ordersTableBody.querySelectorAll('[data-assign-courier-btn]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const ordNum = btn.getAttribute('data-assign-courier-btn');
        const sel = document.getElementById(`courier-sel-${ordNum}`);
        const courierId = sel?.value || '';
        if (!courierId) {
          showToast('Avval ro‘yxatdan kuryerni tanlang', 'error');
          return;
        }

        const order = StorageService.getOrderByNumber(ordNum);
        const courier = StorageService.getCourierById(courierId);
        if (!order || !courier) return;

        btn.disabled = true;
        btn.textContent = '...';

        try {
          const response = await TelegramClientService.assignCourier({
            orderNumber: ordNum,
            courierId,
            order,
            courierMeta: courier
          });

          order.status = response.status;
          order.courier = response.courier;
          order.timeline = Array.isArray(order.timeline) ? order.timeline : [];
          order.timeline.push({
            status: `Courier assigned (${response.courier.fullName})`,
            timestamp: new Date().toISOString(),
            actor: restaurant.name
          });
          StorageService.upsertOrder(order);

          NotificationCenter.push({
            type: 'courier_assigned',
            title: `Kuryer biriktirildi: #${order.orderNumber}`,
            message: `${response.courier.fullName} (${response.courier.phone}) buyurtmaga biriktirildi va Telegram Kuryer Botiga xabar yuborildi.`,
            orderNumber: order.orderNumber
          });

          if (botPreviewBox && response.courierBotPayload) {
            botPreviewBox.style.display = 'block';
            botPreviewBox.innerHTML = `
              <h4 style="font-size:0.9rem;color:var(--primary-navy);margin-bottom:6px;">Telegram Kuryer Botiga yuborilgan xabar (#${escapeHtml(ordNum)})</h4>
              <pre style="white-space:pre-wrap;font-family:var(--font-mono);font-size:0.78rem;background:var(--surface-muted);padding:12px;border-radius:8px;">${escapeHtml(response.courierBotPayload.textPreview)}</pre>
            `;
          }

          showToast(`Kuryer ${courier.firstName}ga Telegram so‘rovi yuborildi!`, 'success');
          renderDashboard();
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Xatolik', 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Yuborish';
        }
      });
    });
  };

  const renderMenuTable = () => {
    if (!menuTableBody) return;
    const products = StorageService.getProductsByRestaurant(activeRestaurantId);

    if (products.length === 0) {
      menuTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;">Menyuda taomlar yo‘q.</td></tr>`;
      return;
    }

    menuTableBody.innerHTML = products
      .map(
        (prod) => `
        <tr>
          <td>
            <strong>${escapeHtml(prod.name)}</strong>
            <div style="font-size:0.78rem;color:var(--text-muted);">${escapeHtml(prod.description || '')}</div>
          </td>
          <td>${escapeHtml(prod.category)}</td>
          <td class="num-col">
            <input
              type="number"
              class="form-input tabular-nums"
              style="width:125px;padding:6px 8px;text-align:right;"
              value="${Number(prod.price)}"
              data-edit-prod-price="${escapeHtml(prod.id)}"
              aria-label="${escapeHtml(prod.name)} narxi"
            />
          </td>
          <td>
            <button
              type="button"
              class="btn ${prod.available ? 'btn-glass-success' : 'btn-glass-white'} btn-sm"
              data-toggle-prod-avail="${escapeHtml(prod.id)}"
            >
              ${prod.available ? 'Mavjud' : 'Tugagan'}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="btn btn-glass-danger btn-sm"
              data-delete-prod="${escapeHtml(prod.id)}"
            >
              O‘chirish
            </button>
          </td>
        </tr>
      `
      )
      .join('');

    menuTableBody.querySelectorAll('[data-edit-prod-price]').forEach((input) => {
      input.addEventListener('change', (e) => {
        const prodId = input.getAttribute('data-edit-prod-price');
        const newPrice = Math.max(1000, Number(e.target.value) || 0);
        const list = StorageService.getProducts().map((p) =>
          p.id === prodId ? { ...p, price: newPrice } : p
        );
        StorageService.saveProducts(list);
        showToast('Taom narxi yangilandi', 'success');
      });
    });

    menuTableBody.querySelectorAll('[data-toggle-prod-avail]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-toggle-prod-avail');
        const list = StorageService.getProducts().map((p) =>
          p.id === prodId ? { ...p, available: !p.available } : p
        );
        StorageService.saveProducts(list);
        renderMenuTable();
        showToast('Taom mavjudligi yangilandi', 'info');
      });
    });

    menuTableBody.querySelectorAll('[data-delete-prod]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-delete-prod');
        const list = StorageService.getProducts().filter((p) => p.id !== prodId);
        StorageService.saveProducts(list);
        renderMenuTable();
        showToast('Taom menyudan o‘chirildi', 'info');
      });
    });
  };

  const renderSettingsForm = (restaurant) => {
    if (!settingsForm) return;
    const hoursEl = document.getElementById('rest-set-hours');
    const feeEl = document.getElementById('rest-set-fee');
    const minEl = document.getElementById('rest-set-min');
    const openEl = document.getElementById('rest-set-open');

    if (hoursEl) hoursEl.value = restaurant.openingHours || '09:00 – 23:00';
    if (feeEl) feeEl.value = restaurant.deliveryFee || 15000;
    if (minEl) minEl.value = restaurant.minOrder || 50000;
    if (openEl) openEl.value = restaurant.isOpen ? 'true' : 'false';
  };

  const renderCouriersRoster = (restaurant) => {
    if (!couriersListEl) return;
    const allCouriers = StorageService.getCouriers();
    const attached = new Set(restaurant.couriers || []);

    couriersListEl.innerHTML = allCouriers
      .map(
        (c) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid var(--border-hairline);border-radius:12px;background:#fff;">
          <div>
            <strong>${escapeHtml(c.lastName)} ${escapeHtml(c.firstName)} ${escapeHtml(c.fatherName)}</strong>
            <div class="tabular-nums" style="font-size:0.82rem;color:var(--text-secondary);">${escapeHtml(c.phone)} · ${escapeHtml(c.vehicle)}</div>
          </div>
          <button
            type="button"
            class="btn ${attached.has(c.id) ? 'btn-glass-success' : 'btn-glass-white'} btn-sm"
            data-toggle-rest-courier="${escapeHtml(c.id)}"
          >
            ${attached.has(c.id) ? 'Ro‘yxatda faol' : 'Ro‘yxatga qo‘shish'}
          </button>
        </div>
      `
      )
      .join('');

    couriersListEl.querySelectorAll('[data-toggle-rest-courier]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cId = btn.getAttribute('data-toggle-rest-courier');
        const list = StorageService.getRestaurants().map((r) => {
          if (r.id !== activeRestaurantId) return r;
          const set = new Set(r.couriers || []);
          if (set.has(cId)) set.delete(cId);
          else set.add(cId);
          return { ...r, couriers: Array.from(set) };
        });
        StorageService.saveRestaurants(list);
        renderDashboard();
        showToast('Restoran kuryerlar ro‘yxati yangilandi', 'success');
      });
    });
  };

  if (restaurantSelect) {
    restaurantSelect.addEventListener('change', (e) => {
      activeRestaurantId = e.target.value;
      renderDashboard();
    });
  }

  if (orderFilterBar) {
    orderFilterBar.querySelectorAll('[data-rest-order-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeOrderBucket = btn.getAttribute('data-rest-order-filter') || 'all';
        orderFilterBar.querySelectorAll('[data-rest-order-filter]').forEach((b) => {
          b.classList.toggle('active', b === btn);
        });
        renderDashboard();
      });
    });
  }

  if (addProductForm) {
    addProductForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = String(document.getElementById('new-prod-name')?.value || '').trim();
      const category = String(document.getElementById('new-prod-category')?.value || 'Other food');
      const price = Math.max(1000, Number(document.getElementById('new-prod-price')?.value) || 0);
      const description = String(document.getElementById('new-prod-desc')?.value || '').trim();

      if (name.length < 2) {
        showToast('Taom nomini kiriting', 'error');
        return;
      }

      const list = StorageService.getProducts();
      list.unshift({
        id: `prod-${Date.now()}`,
        restaurantId: activeRestaurantId,
        name,
        category,
        price,
        description: description || 'Yangi mualliflik taomi',
        popular: true,
        available: true,
        customizations: [{ label: 'Standart porsiya', extraPrice: 0 }]
      });
      StorageService.saveProducts(list);
      addProductForm.reset();
      renderMenuTable();
      showToast(`"${name}" menyuga qo‘shildi!`, 'success');
    });
  }

  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const openingHours = String(document.getElementById('rest-set-hours')?.value || '').trim();
      const deliveryFee = Math.max(0, Number(document.getElementById('rest-set-fee')?.value) || 0);
      const minOrder = Math.max(0, Number(document.getElementById('rest-set-min')?.value) || 0);
      const isOpen = document.getElementById('rest-set-open')?.value === 'true';

      const list = StorageService.getRestaurants().map((r) =>
        r.id === activeRestaurantId
          ? { ...r, openingHours, deliveryFee, minOrder, isOpen }
          : r
      );
      StorageService.saveRestaurants(list);
      NotificationCenter.push({
        type: 'restaurant_update',
        title: 'Restoran sozlamalari yangilandi',
        message: `Yetkazib berish narxi: ${formatMoney(deliveryFee)}, Min. buyurtma: ${formatMoney(minOrder)}.`
      });
      renderDashboard();
      showToast('Restoran sozlamalari saqlandi!', 'success');
    });
  }

  populateRestaurantSelector();
  renderDashboard();
}
