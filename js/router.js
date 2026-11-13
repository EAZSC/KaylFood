/**
 * KaylFood — Shared Layout Router, 3-Zone Top Bar, Drawers & Footer
 * Ensures every navigation link, cart button, and notification center works across all pages.
 */
import { initStorage, StorageService } from './storage.js';
import { CartService } from './cart.js';
import { NotificationCenter } from './notifications.js';
import { escapeHtml, getBasePath } from './utils.js';

export function initGlobalShell(activePage = 'home') {
  initStorage();
  if (typeof document === 'undefined') return;

  renderTopBar(activePage);
  ensureDrawersExist();
  renderFooter();

  CartService.refreshUI();
  NotificationCenter.updateBadges();
  NotificationCenter.renderDrawerList();
}

function renderTopBar(activePage) {
  const headerMount = document.getElementById('site-header');
  if (!headerMount) return;

  const base = getBasePath();
  const user = StorageService.getCurrentUser();
  const activeOrderNum = StorageService.getActiveOrderNumber();
  const cartSummary = CartService.getSummary();

  // Strict 3-Zone Top Bar Contract (Brand wordmark | 5 single-line nav links | 1 primary CTA)
  headerMount.className = 'site-header';
  headerMount.innerHTML = `
    <div class="container header-inner">
      <a href="${base}/index.html" class="brand-wordmark">
        <span class="brand-mark-box">KF</span>
        <span>KaylFood</span>
      </a>

      <nav class="primary-nav" aria-label="Asosiy navigatsiya">
        <a href="${base}/index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">Bosh sahifa</a>
        <a href="${base}/tracking.html?order=${encodeURIComponent(activeOrderNum)}" class="nav-link ${activePage === 'tracking' ? 'active' : ''}">Buyurtma kuzatuvi</a>
        <a href="${base}/restaurant-dashboard/index.html" class="nav-link ${activePage === 'restaurant-dashboard' ? 'active' : ''}">Restoran paneli</a>
        <a href="${base}/courier-dashboard/index.html" class="nav-link ${activePage === 'courier-dashboard' ? 'active' : ''}">Kuryer paneli</a>
        <a href="${base}/admin/index.html" class="nav-link ${activePage === 'admin' ? 'active' : ''}">Super Admin</a>
      </nav>

      <div class="header-actions">
        <button type="button" class="btn btn-glass-primary" id="open-cart-drawer-btn" aria-label="Savatchani ochish">
          <span>Savatcha</span>
          <span class="tabular-nums" data-cart-count>${cartSummary.itemCount}</span>
        </button>
      </div>
    </div>
    <div class="mobile-nav-strip" style="display:none;">
      <a href="${base}/index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">Bosh sahifa</a>
      <a href="${base}/tracking.html?order=${encodeURIComponent(activeOrderNum)}" class="nav-link ${activePage === 'tracking' ? 'active' : ''}">Kuzatuv</a>
      <a href="${base}/customer/profile.html" class="nav-link ${activePage === 'profile' ? 'active' : ''}">${user ? escapeHtml(user.firstName) : 'Profil'}</a>
      <a href="${base}/restaurant-dashboard/index.html" class="nav-link ${activePage === 'restaurant-dashboard' ? 'active' : ''}">Restoran</a>
      <a href="${base}/courier-dashboard/index.html" class="nav-link ${activePage === 'courier-dashboard' ? 'active' : ''}">Kuryer</a>
      <a href="${base}/admin/index.html" class="nav-link ${activePage === 'admin' ? 'active' : ''}">Admin</a>
    </div>
  `;

  headerMount.querySelector('#open-cart-drawer-btn')?.addEventListener('click', () => {
    openDrawer('cart');
  });
}

function ensureDrawersExist() {
  if (document.getElementById('global-drawer-backdrop')) return;

  const base = getBasePath();
  const user = StorageService.getCurrentUser();
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div id="global-drawer-backdrop" class="drawer-backdrop"></div>

    <!-- Shopping Cart Slide Drawer -->
    <aside id="cart-slide-drawer" class="slide-drawer" aria-label="Xarid savatchasi">
      <div class="drawer-header">
        <div>
          <h3 style="font-size:1.15rem;">Xarid savatchasi</h3>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">
            ${
              user
                ? `<a href="${base}/customer/profile.html" style="color:var(--primary-blue);font-weight:600;">${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)} profili</a>`
                : `<a href="${base}/login.html" style="color:var(--primary-blue);font-weight:600;">Tizimga kirish / Ro‘yxatdan o‘tish</a>`
            }
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button type="button" class="btn btn-glass-white btn-sm" id="switch-to-notif-btn">
            Bildirishnomalar (<span class="tabular-nums" data-notification-count>0</span>)
          </button>
          <button type="button" class="btn btn-glass-white btn-sm" data-close-drawers aria-label="Savatchani yopish">✕</button>
        </div>
      </div>
      <div id="cart-drawer-body" class="drawer-body"></div>
      <div id="cart-drawer-footer" class="drawer-footer"></div>
    </aside>

    <!-- Notification Center Slide Drawer -->
    <aside id="notif-slide-drawer" class="slide-drawer" aria-label="Bildirishnomalar markazi">
      <div class="drawer-header">
        <h3 style="font-size:1.15rem;">Bildirishnomalar markazi</h3>
        <div style="display:flex;gap:8px;">
          <button type="button" class="btn btn-glass-white btn-sm" id="mark-notifs-read-btn">O‘qildi</button>
          <button type="button" class="btn btn-glass-white btn-sm" data-close-drawers aria-label="Yopish">✕</button>
        </div>
      </div>
      <div id="notification-drawer-body" class="drawer-body"></div>
    </aside>
  `;

  document.body.appendChild(wrapper);

  document.getElementById('global-drawer-backdrop')?.addEventListener('click', closeDrawers);
  document.querySelectorAll('[data-close-drawers]').forEach((btn) => {
    btn.addEventListener('click', closeDrawers);
  });

  document.getElementById('switch-to-notif-btn')?.addEventListener('click', () => {
    openDrawer('notifications');
  });

  document.getElementById('mark-notifs-read-btn')?.addEventListener('click', () => {
    NotificationCenter.markAllRead();
  });
}

export function openDrawer(which = 'cart') {
  const backdrop = document.getElementById('global-drawer-backdrop');
  const cartDrawer = document.getElementById('cart-slide-drawer');
  const notifDrawer = document.getElementById('notif-slide-drawer');

  backdrop?.classList.add('open');
  if (which === 'notifications') {
    cartDrawer?.classList.remove('open');
    notifDrawer?.classList.add('open');
    NotificationCenter.renderDrawerList();
  } else {
    notifDrawer?.classList.remove('open');
    cartDrawer?.classList.add('open');
    CartService.renderCartDrawer();
  }
}

export function closeDrawers() {
  document.getElementById('global-drawer-backdrop')?.classList.remove('open');
  document.getElementById('cart-slide-drawer')?.classList.remove('open');
  document.getElementById('notif-slide-drawer')?.classList.remove('open');
}

function renderFooter() {
  const footerMount = document.getElementById('site-footer');
  if (!footerMount) return;

  const base = getBasePath();
  const settings = StorageService.getSettings();

  footerMount.className = 'site-footer';
  footerMount.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <a href="${base}/index.html" class="brand-wordmark" style="margin-bottom:12px;">
            <span class="brand-mark-box">KF</span>
            <span>KaylFood</span>
          </a>
          <p style="font-size:0.875rem;color:var(--text-secondary);max-width:34ch;">
            Toshkentning yetakchi restoranlaridan issiq taomlarni tezkor yetkazib berish va Telegram orqali shaffof nazorat platformasi.
          </p>
        </div>

        <div class="footer-col">
          <h4>Mijozlar uchun</h4>
          <ul class="footer-links">
            <li><a href="${base}/index.html#restaurants-section">Restoranlar katalogi</a></li>
            <li><a href="${base}/checkout.html">Savatcha va to‘lov</a></li>
            <li><a href="${base}/tracking.html">Buyurtmani kuzatish</a></li>
            <li><a href="${base}/customer/profile.html">Shaxsiy kabinet va manzillar</a></li>
            <li><a href="${base}/login.html">Kirish / Ro‘yxatdan o‘tish</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Hamkorlar va Boshqaruv</h4>
          <ul class="footer-links">
            <li><a href="${base}/restaurant-dashboard/index.html">Restoran egasi kabineti</a></li>
            <li><a href="${base}/courier-dashboard/index.html">Kuryerlik boshqaruv paneli</a></li>
            <li><a href="${base}/admin/index.html">Super Admin boshqaruvi</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Aloqa markazi</h4>
          <ul class="footer-links">
            <li><a href="tel:+998712000007">Ishonch telefoni: ${escapeHtml(settings.supportPhone)}</a></li>
            <li><a href="mailto:${escapeHtml(settings.supportEmail)}">Email: ${escapeHtml(settings.supportEmail)}</a></li>
            <li><span style="font-size:0.85rem;color:var(--text-muted);">Ish vaqti: 24/7 uzluksiz</span></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© 2026 ${escapeHtml(settings.platformName)} Marketplace. Barcha huquqlar himoyalangan.</span>
        <div style="display:flex;gap:16px;">
          <a href="${base}/customer/profile.html">Mijoz profili</a>
          <a href="${base}/tracking.html">Buyurtma holati</a>
          <a href="${base}/admin/index.html">Tizim sozlamalari</a>
        </div>
      </div>
    </div>
  `;
}
