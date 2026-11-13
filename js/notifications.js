/**
 * KaylFood — In-App Notification Center (Requirement 15)
 * Supports unread badge counts, drawer rendering, and real-time events for:
 * - New orders
 * - Order confirmation
 * - Courier assignment
 * - Delivery status changes
 * - Order completion
 * - Restaurant updates
 */
import { StorageService } from './storage.js';
import { escapeHtml, formatDateTime, getBasePath } from './utils.js';

export const NotificationCenter = {
  getAll() {
    return StorageService.getNotifications();
  },

  getUnreadCount() {
    return this.getAll().filter((n) => !n.read).length;
  },

  push({ type, title, message, orderNumber = null }) {
    const list = this.getAll();
    const item = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: type || 'info',
      title,
      message,
      orderNumber,
      createdAt: new Date().toISOString(),
      read: false
    };
    list.unshift(item);
    StorageService.saveNotifications(list.slice(0, 40));
    this.updateBadges();
    this.renderDrawerList();
    return item;
  },

  markAllRead() {
    const list = this.getAll().map((n) => ({ ...n, read: true }));
    StorageService.saveNotifications(list);
    this.updateBadges();
    this.renderDrawerList();
  },

  clearAll() {
    StorageService.saveNotifications([]);
    this.updateBadges();
    this.renderDrawerList();
  },

  updateBadges() {
    if (typeof document === 'undefined') return;
    const unread = this.getUnreadCount();
    document.querySelectorAll('[data-notification-count]').forEach((el) => {
      el.textContent = unread > 0 ? `${unread}` : '0';
      el.style.display = unread > 0 ? 'inline-flex' : 'none';
    });
  },

  renderDrawerList() {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('notification-drawer-body');
    if (!container) return;

    const list = this.getAll();
    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 16px;color:var(--text-muted);">
          <p style="font-weight:600;color:var(--text-primary);margin-bottom:6px;">Hozircha bildirishnomalar yo‘q</p>
          <p style="font-size:0.85rem;">Yangi buyurtmalar, kuryer tayinlanishi va yetkazib berish o‘zgarishlari shu yerda ko‘rinadi.</p>
        </div>
      `;
      return;
    }

    const base = getBasePath();
    container.innerHTML = list
      .map(
        (item) => `
        <div class="timeline-step ${item.read ? '' : 'current'}" style="flex-direction:column;gap:6px;">
          <div style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:8px;">
            <strong style="font-size:0.9rem;color:var(--primary-navy);">${escapeHtml(item.title)}</strong>
            <span class="tabular-nums" style="font-size:0.75rem;color:var(--text-muted);">${escapeHtml(formatDateTime(item.createdAt))}</span>
          </div>
          <p style="font-size:0.84rem;color:var(--text-secondary);">${escapeHtml(item.message)}</p>
          ${
            item.orderNumber
              ? `<div style="margin-top:4px;">
                  <a href="${base}/tracking.html?order=${encodeURIComponent(item.orderNumber)}" class="btn btn-glass-white btn-sm">
                    Buyurtmani kuzatish (#${escapeHtml(item.orderNumber)})
                  </a>
                 </div>`
              : ''
          }
        </div>
      `
      )
      .join('');
  }
};
