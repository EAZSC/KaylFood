/**
 * KaylFood — LocalStorage State Manager
 * Keeps demo marketplace state synchronized across pages and browser tabs.
 */
import {
  SEED_CATEGORIES,
  SEED_RESTAURANTS,
  SEED_PRODUCTS,
  SEED_COURIERS,
  SEED_ORDERS,
  SEED_USERS,
  SEED_SETTINGS
} from './data.js';

const KEYS = {
  CATEGORIES: 'kaylfood_categories_v1',
  RESTAURANTS: 'kaylfood_restaurants_v1',
  PRODUCTS: 'kaylfood_products_v1',
  COURIERS: 'kaylfood_couriers_v1',
  ORDERS: 'kaylfood_orders_v1',
  USERS: 'kaylfood_users_v1',
  CURRENT_USER: 'kaylfood_current_user_v1',
  CART: 'kaylfood_cart_v1',
  RECENT_RESTAURANTS: 'kaylfood_recent_restaurants_v1',
  NOTIFICATIONS: 'kaylfood_notifications_v1',
  SETTINGS: 'kaylfood_settings_v1',
  ACTIVE_ORDER_NUMBER: 'kaylfood_active_order_v1'
};

function readJson(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof localStorage === 'undefined') return value;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
  return value;
}

export function initStorage() {
  if (!readJson(KEYS.CATEGORIES, null)) writeJson(KEYS.CATEGORIES, SEED_CATEGORIES);
  if (!readJson(KEYS.RESTAURANTS, null)) writeJson(KEYS.RESTAURANTS, SEED_RESTAURANTS);
  if (!readJson(KEYS.PRODUCTS, null)) writeJson(KEYS.PRODUCTS, SEED_PRODUCTS);
  if (!readJson(KEYS.COURIERS, null)) writeJson(KEYS.COURIERS, SEED_COURIERS);
  if (!readJson(KEYS.ORDERS, null)) writeJson(KEYS.ORDERS, SEED_ORDERS);
  if (!readJson(KEYS.USERS, null)) writeJson(KEYS.USERS, SEED_USERS);
  if (!readJson(KEYS.SETTINGS, null)) writeJson(KEYS.SETTINGS, SEED_SETTINGS);
  if (!readJson(KEYS.CURRENT_USER, null)) {
    writeJson(KEYS.CURRENT_USER, SEED_USERS[0]);
  }
  if (!readJson(KEYS.NOTIFICATIONS, null)) {
    writeJson(KEYS.NOTIFICATIONS, [
      {
        id: 'notif-seed-1',
        type: 'order_status',
        title: 'Buyurtma #KF-842109 tayyorlanmoqda',
        message: 'Oshxona Rayhon Milliy & Grill buyurtmangizni tayyorlashni boshladi.',
        createdAt: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
        read: false,
        orderNumber: 'KF-842109'
      }
    ]);
  }
}

export const StorageService = {
  getCategories: () => readJson(KEYS.CATEGORIES, SEED_CATEGORIES),
  saveCategories: (list) => writeJson(KEYS.CATEGORIES, list),

  getRestaurants: () => readJson(KEYS.RESTAURANTS, SEED_RESTAURANTS),
  saveRestaurants: (list) => writeJson(KEYS.RESTAURANTS, list),
  getRestaurantById: (id) => {
    const list = readJson(KEYS.RESTAURANTS, SEED_RESTAURANTS);
    return list.find((r) => r.id === id) || null;
  },

  getProducts: () => readJson(KEYS.PRODUCTS, SEED_PRODUCTS),
  saveProducts: (list) => writeJson(KEYS.PRODUCTS, list),
  getProductsByRestaurant: (restaurantId) => {
    const list = readJson(KEYS.PRODUCTS, SEED_PRODUCTS);
    return list.filter((p) => p.restaurantId === restaurantId);
  },

  getCouriers: () => readJson(KEYS.COURIERS, SEED_COURIERS),
  saveCouriers: (list) => writeJson(KEYS.COURIERS, list),
  getCourierById: (id) => {
    const list = readJson(KEYS.COURIERS, SEED_COURIERS);
    return list.find((c) => c.id === id) || null;
  },

  getOrders: () => readJson(KEYS.ORDERS, SEED_ORDERS),
  saveOrders: (list) => writeJson(KEYS.ORDERS, list),
  getOrderByNumber: (orderNumber) => {
    const list = readJson(KEYS.ORDERS, SEED_ORDERS);
    return list.find((o) => o.orderNumber === orderNumber) || null;
  },
  upsertOrder: (orderRecord) => {
    const list = readJson(KEYS.ORDERS, SEED_ORDERS);
    const idx = list.findIndex((o) => o.orderNumber === orderRecord.orderNumber);
    if (idx >= 0) {
      list[idx] = orderRecord;
    } else {
      list.unshift(orderRecord);
    }
    writeJson(KEYS.ORDERS, list);
    writeJson(KEYS.ACTIVE_ORDER_NUMBER, orderRecord.orderNumber);
    return orderRecord;
  },

  getActiveOrderNumber: () => readJson(KEYS.ACTIVE_ORDER_NUMBER, 'KF-842109'),
  setActiveOrderNumber: (num) => writeJson(KEYS.ACTIVE_ORDER_NUMBER, num),

  getUsers: () => readJson(KEYS.USERS, SEED_USERS),
  saveUsers: (list) => writeJson(KEYS.USERS, list),
  getCurrentUser: () => readJson(KEYS.CURRENT_USER, null),
  setCurrentUser: (user) => writeJson(KEYS.CURRENT_USER, user),

  getCart: () =>
    readJson(KEYS.CART, {
      restaurantId: null,
      restaurantName: '',
      items: []
    }),
  saveCart: (cart) => writeJson(KEYS.CART, cart),

  getRecentRestaurants: () => readJson(KEYS.RECENT_RESTAURANTS, ['rest-1', 'rest-2']),
  addRecentRestaurant: (restaurantId) => {
    const current = readJson(KEYS.RECENT_RESTAURANTS, ['rest-1', 'rest-2']);
    const next = [restaurantId, ...current.filter((id) => id !== restaurantId)].slice(0, 4);
    return writeJson(KEYS.RECENT_RESTAURANTS, next);
  },

  getNotifications: () => readJson(KEYS.NOTIFICATIONS, []),
  saveNotifications: (list) => writeJson(KEYS.NOTIFICATIONS, list),

  getSettings: () => readJson(KEYS.SETTINGS, SEED_SETTINGS),
  saveSettings: (settings) => writeJson(KEYS.SETTINGS, settings)
};
