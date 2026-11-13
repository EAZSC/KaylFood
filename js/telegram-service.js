/**
 * KaylFood — Frontend Client for Secure Netlify Serverless Telegram Functions
 * IMPORTANT: No Telegram bot tokens or channel IDs are stored in this file.
 * All Telegram communication is executed server-side via /.netlify/functions/*
 */
import { StorageService } from './storage.js';

async function callServerFunction(functionName, payload, roleOverride = null) {
  const currentUser = StorageService.getCurrentUser();
  const activeRole = roleOverride || currentUser?.role || 'customer';

  const response = await fetch(`/.netlify/functions/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-KaylFood-Role': activeRole
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Server error (${response.status})`);
  }
  return data;
}

export const TelegramClientService = {
  /**
   * Validates & creates order on server, triggering Channel A (Orders) & Channel B (Finance)
   */
  async createOrderAndNotify(orderPayload) {
    return callServerFunction('create-order', orderPayload, 'customer');
  },

  /**
   * Explicitly sends Channel A — Main Orders notification via server function
   */
  async sendOrderNotification(order) {
    return callServerFunction('send-order-notification', { order }, 'restaurant');
  },

  /**
   * Explicitly sends Channel B — Financial Reports notification via server function
   */
  async sendFinanceNotification(order) {
    return callServerFunction('send-finance-notification', { order }, 'super_admin');
  },

  /**
   * Assigns courier and sends Courier Bot inline-keyboard notification
   */
  async assignCourier({ orderNumber, courierId, order, courierMeta }) {
    return callServerFunction(
      'assign-courier',
      {
        orderNumber,
        courierId,
        order,
        courierMeta,
        actorRole: 'restaurant'
      },
      'restaurant'
    );
  },

  /**
   * Processes courier acceptance, rejection, or delivery status progression
   */
  async submitCourierAction({ orderNumber, courierId, action, order, courierMeta }) {
    return callServerFunction(
      'courier-action',
      {
        orderNumber,
        courierId,
        action,
        order,
        courierMeta
      },
      'courier'
    );
  }
};
