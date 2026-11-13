import {
  getSavedOrder,
  saveOrderRecord,
  getCanonicalCourier
} from './_shared/db-adapter.js';
import { sendTelegramApiMessage, formatCurrencyUZS } from './_shared/telegram-api.js';

const ACTION_TO_STATUS = {
  accept: 'Courier assigned',
  reject: 'Ready for pickup',
  picked_up: 'Courier picked up the order',
  on_the_way: 'On the way',
  delivered: 'Delivered'
};

export async function handler(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-KaylFood-Role',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: 'Method Not Allowed. Use POST.' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const orderNumber = String(body.orderNumber || '').trim();
    const courierId = String(body.courierId || '').trim();
    const action = String(body.action || '').trim().toLowerCase();

    if (!orderNumber || !courierId || !ACTION_TO_STATUS[action]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          ok: false,
          error: 'Invalid courier action parameters. Allowed actions: accept, reject, picked_up, on_the_way, delivered.'
        })
      };
    }

    const courier = getCanonicalCourier(courierId, body.courierMeta);
    if (!courier) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ ok: false, error: 'Unauthorized courier identity.' })
      };
    }

    let order = getSavedOrder(orderNumber);
    if (!order && body.order) {
      order = { ...body.order, orderNumber };
    }
    if (!order) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ ok: false, error: `Order ${orderNumber} not found.` })
      };
    }

    // Security check: Only the assigned courier is allowed to update their delivery
    if (order.courier && order.courier.id && order.courier.id !== courier.id) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          ok: false,
          error: 'Forbidden: Only the assigned courier is permitted to update this delivery.'
        })
      };
    }

    const nowIso = new Date().toISOString();
    const newStatus = ACTION_TO_STATUS[action];
    const courierFullName = `${courier.lastName} ${courier.firstName} ${courier.fatherName}`.trim();

    if (action === 'reject') {
      order.status = 'Ready for pickup';
      order.courier = null;
    } else {
      order.status = newStatus;
      order.courier = {
        id: courier.id,
        firstName: courier.firstName,
        lastName: courier.lastName,
        fatherName: courier.fatherName,
        fullName: courierFullName,
        phone: courier.phone,
        vehicle: courier.vehicle,
        assignmentState: action === 'accept' ? 'accepted' : action,
        updatedAt: nowIso
      };
    }

    order.timeline = Array.isArray(order.timeline) ? order.timeline : [];
    order.timeline.push({
      status: action === 'accept' ? `Courier accepted (${courierFullName})` : newStatus,
      timestamp: nowIso,
      actor: courierFullName
    });

    saveOrderRecord(order);

    // Notify main orders channel of courier progression
    const ordersChannelId = (process.env.TELEGRAM_ORDERS_CHANNEL_ID || '').trim();
    const statusText = [
      `<b>KURYER HOLATI YANGILANDI — #${order.orderNumber}</b>`,
      `<b>Kuryer:</b> ${courierFullName} (${courier.phone})`,
      `<b>Yangi holat:</b> <b>${order.status}</b>`,
      `<b>Restoran:</b> ${order.restaurantName || ''}`,
      `<b>Summa:</b> ${formatCurrencyUZS(order.totalAmount)}`
    ].join('\n');

    const telegramResult = await sendTelegramApiMessage({
      botType: 'courier',
      chatId: ordersChannelId,
      text: statusText
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        orderNumber: order.orderNumber,
        action,
        status: order.status,
        courier: order.courier,
        timeline: order.timeline,
        telegramNotification: telegramResult
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        error: 'Failed to process courier action.',
        details: err instanceof Error ? err.message : 'Unknown error'
      })
    };
  }
}
