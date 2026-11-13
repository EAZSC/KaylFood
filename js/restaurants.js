/**
 * KaylFood — Restaurant Catalog & Restaurant Detail Page Controller
 * Strictly preserves:
 *   <div class="restaurant-image"><!-- ADD RESTAURANT IMAGE HERE --></div>
 *   <div class="restaurant-logo"><!-- ADD RESTAURANT LOGO HERE --></div>
 */
import { StorageService } from './storage.js';
import { getRestaurantImageUrl, getRestaurantMonogram } from './data.js';
import { renderProductCardHtml, bindProductCardActions } from './products.js';
import { escapeHtml, formatMoney, getBasePath } from './utils.js';

export function renderRestaurantCardHtml(restaurant) {
  const base = getBasePath();
  const statusClass = restaurant.isOpen ? 'status-open' : 'status-closed';
  const statusText = restaurant.isOpen ? 'Ochiq' : 'Yopiq';
  const imgUrl = getRestaurantImageUrl(restaurant);
  const monogram = getRestaurantMonogram(restaurant);

  return `
    <article class="restaurant-card" data-restaurant-id="${escapeHtml(restaurant.id)}">
      <div class="restaurant-image">
        <!-- ADD RESTAURANT IMAGE HERE -->
        <img
          src="${escapeHtml(imgUrl)}"
          alt="${escapeHtml(restaurant.name)}"
          referrerpolicy="no-referrer"
          loading="lazy"
        />
      </div>
      <div class="restaurant-card-body">
        <div class="restaurant-card-header">
          <div class="restaurant-logo">
            <!-- ADD RESTAURANT LOGO HERE -->
            <span>${escapeHtml(monogram)}</span>
          </div>
          <div class="restaurant-card-title-wrap">
            <h3 class="restaurant-card-title">${escapeHtml(restaurant.name)}</h3>
            <div class="meta-inline">
              <span class="tabular-nums" style="color:var(--primary-navy);font-weight:700;">★ ${Number(restaurant.rating).toFixed(1)}</span>
              <span class="meta-sep" aria-hidden="true">·</span>
              <span>${escapeHtml(restaurant.deliveryTime)}</span>
              <span class="meta-sep" aria-hidden="true">·</span>
              <span class="${statusClass}">${statusText}</span>
            </div>
          </div>
        </div>

        <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.45;">
          ${escapeHtml(restaurant.description || restaurant.cuisine || '')}
        </p>

        <div class="meta-inline">
          <span>Yetkazish: <strong class="tabular-nums" style="color:var(--text-primary);">${formatMoney(restaurant.deliveryFee)}</strong></span>
          <span class="meta-sep" aria-hidden="true">·</span>
          <span>Min. buyurtma: <strong class="tabular-nums" style="color:var(--text-primary);">${formatMoney(restaurant.minOrder)}</strong></span>
        </div>

        <div class="restaurant-card-footer">
          <span style="font-size:0.78rem;color:var(--text-muted);">${escapeHtml(restaurant.openingHours || '09:00 – 23:00')}</span>
          <a href="${base}/restaurant.html?id=${encodeURIComponent(restaurant.id)}" class="btn btn-glass-primary btn-sm">
            Menyuni ko‘rish
          </a>
        </div>
      </div>
    </article>
  `;
}

export function initHomePageMarketplace() {
  const categoryBar = document.getElementById('home-category-bar');
  const restaurantGrid = document.getElementById('home-restaurants-grid');
  const popularGrid = document.getElementById('home-popular-products-grid');
  const searchInput = document.getElementById('home-search-input');
  const searchForm = document.getElementById('home-search-form');
  const collectionFilterBar = document.getElementById('home-collection-tabs');

  let activeCategory = 'all';
  let activeCollection = 'all'; // 'all' | 'featured' | 'recommended' | 'recent' | 'offers'
  let searchQuery = '';

  const categories = StorageService.getCategories();

  const renderCategories = () => {
    if (!categoryBar) return;
    categoryBar.innerHTML = categories
      .map(
        (cat) => `
        <button
          type="button"
          class="category-btn ${activeCategory === cat.slug ? 'active' : ''}"
          data-cat-slug="${escapeHtml(cat.slug)}"
        >
          ${escapeHtml(cat.name)}
        </button>
      `
      )
      .join('');

    categoryBar.querySelectorAll('[data-cat-slug]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-cat-slug') || 'all';
        renderCategories();
        renderMarketplaceContent();
      });
    });
  };

  const renderMarketplaceContent = () => {
    const allRestaurants = StorageService.getRestaurants().filter((r) => !r.suspended);
    const allProducts = StorageService.getProducts();
    const recentIds = StorageService.getRecentRestaurants();
    const q = searchQuery.trim().toLowerCase();

    let filteredRestaurants = allRestaurants.filter((rest) => {
      const matchesCat =
        activeCategory === 'all' ||
        (Array.isArray(rest.categories) && rest.categories.includes(activeCategory));

      const restProducts = allProducts.filter((p) => p.restaurantId === rest.id);
      const matchesQuery =
        !q ||
        rest.name.toLowerCase().includes(q) ||
        (rest.cuisine || '').toLowerCase().includes(q) ||
        restProducts.some((p) => p.name.toLowerCase().includes(q));

      if (!matchesCat || !matchesQuery) return false;

      if (activeCollection === 'featured') return Boolean(rest.featured);
      if (activeCollection === 'recommended') return Boolean(rest.recommended);
      if (activeCollection === 'recent') return recentIds.includes(rest.id);
      if (activeCollection === 'offers') return Boolean(rest.specialOffer);
      return true;
    });

    if (restaurantGrid) {
      if (filteredRestaurants.length === 0) {
        restaurantGrid.innerHTML = `
          <div style="grid-column:1 / -1;text-align:center;padding:40px 20px;background:var(--surface-glass);border:1px solid var(--border-hairline);border-radius:var(--radius-md);">
            <h3 style="font-size:1.1rem;margin-bottom:6px;">Mos restoranlar topilmadi</h3>
            <p style="font-size:0.88rem;color:var(--text-muted);margin-bottom:14px;">Filtrlarni yoki qidiruv so‘zini o‘zgartirib ko‘ring.</p>
            <button type="button" class="btn btn-glass-white btn-sm" id="reset-home-filters-btn">Filtrlarni tozalash</button>
          </div>
        `;
        restaurantGrid.querySelector('#reset-home-filters-btn')?.addEventListener('click', () => {
          activeCategory = 'all';
          activeCollection = 'all';
          searchQuery = '';
          if (searchInput) searchInput.value = '';
          renderCategories();
          renderMarketplaceContent();
        });
      } else {
        restaurantGrid.innerHTML = filteredRestaurants.map(renderRestaurantCardHtml).join('');
      }
    }

    if (popularGrid) {
      let filteredProducts = allProducts.filter((prod) => {
        const matchesCat = activeCategory === 'all' || prod.category === activeCategory;
        const matchesQuery =
          !q ||
          prod.name.toLowerCase().includes(q) ||
          (prod.description || '').toLowerCase().includes(q);
        return matchesCat && matchesQuery && (q || activeCategory !== 'all' || prod.popular);
      });

      popularGrid.innerHTML = filteredProducts
        .slice(0, 6)
        .map((p) => renderProductCardHtml(p, true))
        .join('');
      bindProductCardActions(popularGrid);
    }
  };

  if (collectionFilterBar) {
    collectionFilterBar.querySelectorAll('[data-collection-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCollection = btn.getAttribute('data-collection-tab') || 'all';
        collectionFilterBar.querySelectorAll('[data-collection-tab]').forEach((b) => {
          b.classList.toggle('active', b === btn);
        });
        renderMarketplaceContent();
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value || '';
      renderMarketplaceContent();
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      searchQuery = searchInput?.value || '';
      renderMarketplaceContent();
      document.getElementById('restaurants-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  renderCategories();
  renderMarketplaceContent();
}

export function initRestaurantDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get('id') || 'rest-1';
  const restaurant =
    StorageService.getRestaurantById(requestedId) || StorageService.getRestaurants()[0];

  if (!restaurant) return;
  StorageService.addRecentRestaurant(restaurant.id);

  const headerMount = document.getElementById('restaurant-detail-header');
  const categoryBar = document.getElementById('restaurant-menu-categories');
  const menuGrid = document.getElementById('restaurant-menu-grid');
  const menuSearchInput = document.getElementById('restaurant-menu-search');
  const switcherSelect = document.getElementById('restaurant-quick-switcher');

  if (switcherSelect) {
    const allRests = StorageService.getRestaurants();
    switcherSelect.innerHTML = allRests
      .map(
        (r) =>
          `<option value="${escapeHtml(r.id)}" ${r.id === restaurant.id ? 'selected' : ''}>${escapeHtml(r.name)}</option>`
      )
      .join('');
    switcherSelect.addEventListener('change', (e) => {
      window.location.href = `restaurant.html?id=${encodeURIComponent(e.target.value)}`;
    });
  }

  if (headerMount) {
    const statusClass = restaurant.isOpen ? 'status-open' : 'status-closed';
    const statusText = restaurant.isOpen ? 'Ochiq · Buyurtma qabul qilinmoqda' : 'Hozir yopiq';
    const restHeroImg = getRestaurantImageUrl(restaurant);
    const monogram = getRestaurantMonogram(restaurant);

    headerMount.innerHTML = `
      <div class="hero-grid" style="padding:28px;">
        <div class="hero-content">
          <div style="display:flex;align-items:center;gap:16px;">
            <div class="restaurant-logo">
              <!-- ADD RESTAURANT LOGO HERE -->
              <span>${escapeHtml(monogram)}</span>
            </div>
            <div>
              <span class="hero-kicker">${escapeHtml(restaurant.cuisine || '')}</span>
              <h1 style="font-size:clamp(1.65rem,2.8vw,2.35rem);">${escapeHtml(restaurant.name)}</h1>
            </div>
          </div>

          <p class="hero-description">${escapeHtml(restaurant.description || '')}</p>

          <div class="meta-inline" style="font-size:0.9rem;">
            <strong class="tabular-nums" style="color:var(--primary-navy);">★ ${Number(restaurant.rating).toFixed(1)} (${restaurant.reviewCount || 120}+ baho)</strong>
            <span class="meta-sep" aria-hidden="true">·</span>
            <span>Yetkazish vaqti: <strong>${escapeHtml(restaurant.deliveryTime)}</strong></span>
            <span class="meta-sep" aria-hidden="true">·</span>
            <span class="${statusClass}">${statusText}</span>
          </div>

          <div class="hero-metrics-strip">
            <div class="hero-metric-item">Yetkazib berish: <strong>${formatMoney(restaurant.deliveryFee)}</strong></div>
            <div class="hero-metric-item">Min. buyurtma: <strong>${formatMoney(restaurant.minOrder)}</strong></div>
            <div class="hero-metric-item">Ish vaqti: <strong>${escapeHtml(restaurant.openingHours || '09:00 – 23:00')}</strong></div>
            <div class="hero-metric-item">Manzil: <span>${escapeHtml(restaurant.address)}</span></div>
          </div>
        </div>

        <div class="hero-image">
          <!-- ADD RESTAURANT IMAGE HERE -->
          <img
            src="${escapeHtml(restHeroImg)}"
            alt="${escapeHtml(restaurant.name)}"
            referrerpolicy="no-referrer"
          />
        </div>
      </div>
    `;
  }

  let activeMenuCat = 'all';
  let menuQuery = '';

  const products = StorageService.getProductsByRestaurant(restaurant.id);
  const uniqueCategories = ['all', ...new Set(products.map((p) => p.category))];

  const renderMenuCategories = () => {
    if (!categoryBar) return;
    categoryBar.innerHTML = uniqueCategories
      .map(
        (cat) => `
        <button
          type="button"
          class="category-btn ${activeMenuCat === cat ? 'active' : ''}"
          data-menu-cat="${escapeHtml(cat)}"
        >
          ${cat === 'all' ? 'Barcha taomlar' : escapeHtml(cat)}
        </button>
      `
      )
      .join('');

    categoryBar.querySelectorAll('[data-menu-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeMenuCat = btn.getAttribute('data-menu-cat') || 'all';
        renderMenuCategories();
        renderMenuProducts();
      });
    });
  };

  const renderMenuProducts = () => {
    if (!menuGrid) return;
    const q = menuQuery.trim().toLowerCase();
    const filtered = products.filter((p) => {
      const matchCat = activeMenuCat === 'all' || p.category === activeMenuCat;
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q);
      return matchCat && matchQ;
    });

    if (filtered.length === 0) {
      menuGrid.innerHTML = `
        <div style="grid-column:1 / -1;text-align:center;padding:36px;background:var(--surface-glass);border-radius:var(--radius-md);border:1px solid var(--border-hairline);">
          <p style="font-weight:600;">Ushbu bo‘limda taom topilmadi.</p>
        </div>
      `;
      return;
    }

    menuGrid.innerHTML = filtered.map((p) => renderProductCardHtml(p, false)).join('');
    bindProductCardActions(menuGrid);
  };

  if (menuSearchInput) {
    menuSearchInput.addEventListener('input', (e) => {
      menuQuery = e.target.value || '';
      renderMenuProducts();
    });
  }

  renderMenuCategories();
  renderMenuProducts();
}
