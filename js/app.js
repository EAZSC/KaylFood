/**
 * KaylFood — Main Application Bootstrapper
 * Initializes the shared shell and dispatches to the active page module.
 */
import { initGlobalShell } from './router.js';
import { initHomePageMarketplace, initRestaurantDetailPage } from './restaurants.js';
import { initLoginPage, initRegisterPage } from './auth.js';
import { initCheckoutPage } from './checkout.js';
import { initTrackingPage } from './tracking.js';
import { initCustomerProfilePage } from './orders.js';
import { initRestaurantDashboard } from './restaurant-dashboard.js';
import { initCourierDashboard } from './courier.js';
import { initAdminDashboard } from './admin-dashboard.js';

function bootstrapKaylFood() {
  if (typeof document === 'undefined') return;
  const pageId = document.body.dataset.page || 'home';
  initGlobalShell(pageId);

  switch (pageId) {
    case 'home':
      initHomePageMarketplace();
      break;
    case 'restaurant':
      initRestaurantDetailPage();
      break;
    case 'login':
      initLoginPage();
      break;
    case 'register':
      initRegisterPage();
      break;
    case 'checkout':
      initCheckoutPage();
      break;
    case 'tracking':
      initTrackingPage();
      break;
    case 'profile':
      initCustomerProfilePage();
      break;
    case 'restaurant-dashboard':
      initRestaurantDashboard();
      break;
    case 'courier-dashboard':
      initCourierDashboard();
      break;
    case 'admin':
      initAdminDashboard();
      break;
    default:
      initHomePageMarketplace();
      break;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapKaylFood);
  } else {
    bootstrapKaylFood();
  }
}
