import {
  getSavedOrder,
  saveOrderRecord,
  getCanonicalCourier,
  getCanonicalRestaurant
} from './_shared/db-adapter.js';
import {
  buildCourierAssignmentPayload,
  sendTelegramApiMessage,
  validateTelegramEnv
} from './_shared/telegram-api.js';

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
    const roleHeader = String(event.headers?.['x-kaylfood-role'] || body.actorRole || '').toLowerCase();

    // Enforce role-based authorization on the server
    if (!['restaurant', 'admin', 'super_admin'].includes(roleHeader)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          ok: false,
          error: 'Forbidden: Only restaurant owners or super admins may assign couriers.'
        })
      };
    }

    const orderNumber = String(body.orderNumber || body.order?.orderNumber || '').trim();
    const courierId = String(body.courierId || '').trim();

    if (!orderNumber || !courierId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          ok: false,
          error: 'Both orderNumber and courierId are required.'
        })
      };
    }

    const courier = getCanonicalCourier(courierId, body.courierMeta);
    if (!courier) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ ok: false, error: 'Selected courier was not found.' })
      };
    }

    let order = getSavedOrder(orderNumber);
    if (!order && body.order) {
      const restaurant = getCanonicalRestaurant(body.order.restaurantId, body.order.restaurantMeta);
      order = {
        ...body.order,
        orderNumber,
        restaurantAddress: restaurant?.address || body.order.restaurantAddress || 'Toshkent sh.'
      };
    }

    if (!order) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ ok: false, error: `Order ${orderNumber} not found.` })
      };
    }

    const nowIso = new Date().toISOString();
    order.status = 'Courier assigned';
    order.courier = {
      id: courier.id,
      firstName: courier.firstName,
      lastName: courier.lastName,
      fatherName: courier.fatherName,
      fullName: `${courier.lastName} ${courier.firstName} ${courier.fatherName}`.trim(),
      phone: courier.phone,
      vehicle: courier.vehicle,
      assignmentState: 'pending_acceptance',
      assignedAt: nowIso
    };
    order.timeline = Array.isArray(order.timeline) ? order.timeline : [];
    order.timeline.push({
      status: 'Courier assigned',
      timestamp: nowIso,
      actor: 'Restaurant Owner'
    });

    saveOrderRecord(order);

    const { text, reply_markup } = buildCourierAssignmentPayload(order, courier);
    const envStatus = validateTelegramEnv('courier');
    const targetChatId =
      body.courierTelegramChatId ||
      courier.telegramChatId ||
      (process.env.TELEGRAM_ORDERS_CHANNEL_ID || '').trim();

    const telegramDelivery = await sendTelegramApiMessage({
      botType: 'courier',
      chatId: targetChatId,
      text,
      replyMarkup: reply_markup
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        orderNumber: order.orderNumber,
        status: order.status,
        courier: order.courier,
        envConfigured: envStatus.configured,
        missingEnvVars: envStatus.missing,
        courierBotPayload: {
          textPreview: text.replace(/<[^>]+>/g, ''),
          inlineKeyboard: reply_markup.inline_keyboard
        },
        delivery: telegramDelivery
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        error: 'Failed to assign courier on server.',
        details: err instanceof Error ? err.message : 'Unknown error'
      })
    };
  }
}
