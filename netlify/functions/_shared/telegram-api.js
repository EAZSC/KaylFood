/**
 * KaylFood Secure Server-Side Telegram Bot API Service
 * Reads credentials strictly from process.env inside serverless functions.
 * Never exposes secret tokens in responses or logs.
 */

const PLACEHOLDER_TOKENS = new Set([
  '',
  'PUT_MAIN_BOT_TOKEN_HERE',
  'PUT_COURIER_BOT_TOKEN_HERE',
  'PUT_COURIER_BOT_USERNAME_HERE'
]);

export function validateTelegramEnv(type = 'main') {
  const missing = [];

  if (type === 'main' || type === 'orders') {
    const token = (process.env.TELEGRAM_MAIN_BOT_TOKEN || '').trim();
    const ordersChannel = (process.env.TELEGRAM_ORDERS_CHANNEL_ID || '').trim();
    if (!token || PLACEHOLDER_TOKENS.has(token)) {
      missing.push('TELEGRAM_MAIN_BOT_TOKEN');
    }
    if (!ordersChannel) {
      missing.push('TELEGRAM_ORDERS_CHANNEL_ID');
    }
  }

  if (type === 'main' || type === 'finance') {
    const token = (process.env.TELEGRAM_MAIN_BOT_TOKEN || '').trim();
    const financeChannel = (process.env.TELEGRAM_FINANCE_CHANNEL_ID || '').trim();
    if (!token || PLACEHOLDER_TOKENS.has(token)) {
      if (!missing.includes('TELEGRAM_MAIN_BOT_TOKEN')) missing.push('TELEGRAM_MAIN_BOT_TOKEN');
    }
    if (!financeChannel) {
      missing.push('TELEGRAM_FINANCE_CHANNEL_ID');
    }
  }

  if (type === 'courier') {
    const courierToken = (process.env.TELEGRAM_COURIER_BOT_TOKEN || '').trim();
    if (!courierToken || PLACEHOLDER_TOKENS.has(courierToken)) {
      missing.push('TELEGRAM_COURIER_BOT_TOKEN');
    }
  }

  return {
    configured: missing.length === 0,
    missing
  };
}

export function formatCurrencyUZS(amount) {
  const num = Number(amount) || 0;
  return `${num.toLocaleString('ru-RU')} so'm`;
}

export function formatPaymentMethodLabel(method) {
  const map = {
    cash: 'Naqd pul (Cash)',
    card: 'Bank kartasi (Terminal / Card)',
    online: 'Onlayn to‘lov (Payme / Click / Uzum)'
  };
  return map[String(method).toLowerCase()] || method;
}

/**
 * Formats Channel A — Main Orders notification message
 */
export function buildOrderChannelMessage(order) {
  const itemsLines = (order.items || [])
    .map((item, idx) => {
      const custom = item.customization ? ` (${item.customization})` : '';
      return `${idx + 1}. ${item.name}${custom} — ${item.quantity} x ${formatCurrencyUZS(item.unitPrice)} = ${formatCurrencyUZS(item.lineTotal)}`;
    })
    .join('\n');

  const dateFormatted = new Date(order.createdAt || Date.now()).toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent'
  });

  return [
    `<b>YANGI BUYURTMA — KAYLFOOD</b>`,
    `────────────────────`,
    `<b>Buyurtma raqami:</b> #${order.orderNumber}`,
    `<b>Sana va vaqt:</b> ${dateFormatted}`,
    `<b>Restoran:</b> ${order.restaurantName}`,
    ``,
    `<b>Mijoz:</b> ${order.customerName}`,
    `<b>Telefon:</b> ${order.customerPhone}`,
    `<b>Manzil:</b> ${order.deliveryAddress}`,
    order.instructions ? `<b>Izoh:</b> ${order.instructions}` : null,
    ``,
    `<b>Buyurtma tarkibi:</b>`,
    itemsLines,
    `────────────────────`,
    `<b>Taomlar summasi:</b> ${formatCurrencyUZS(order.subtotal)}`,
    `<b>Yetkazib berish:</b> ${formatCurrencyUZS(order.deliveryFee)}`,
    `<b>Jami to‘lov:</b> <b>${formatCurrencyUZS(order.totalAmount)}</b>`,
    `<b>To‘lov turi:</b> ${formatPaymentMethodLabel(order.paymentMethod)}`,
    `<b>Holati:</b> ${order.status}`
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Formats Channel B — Financial Reports notification message
 * Never sends fake financial data — calculates strictly from the actual order.
 */
export function buildFinanceChannelMessage(order) {
  const totalAmount = Number(order.totalAmount) || 0;
  const subtotal = Number(order.subtotal) || 0;
  const deliveryFee = Number(order.deliveryFee) || 0;
  const method = String(order.paymentMethod || 'cash').toLowerCase();

  const cashAmount = method === 'cash' ? totalAmount : 0;
  const cardAmount = method === 'card' ? totalAmount : 0;
  const onlineAmount = method === 'online' ? totalAmount : 0;

  const dateFormatted = new Date(order.createdAt || Date.now()).toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent'
  });

  return [
    `<b>MOLIYAVIY HISOBOT — KAYLFOOD</b>`,
    `────────────────────`,
    `<b>Buyurtma raqami:</b> #${order.orderNumber}`,
    `<b>Restoran:</b> ${order.restaurantName}`,
    `<b>Sana va vaqt:</b> ${dateFormatted}`,
    `────────────────────`,
    `<b>Taomlar summasi (Subtotal):</b> ${formatCurrencyUZS(subtotal)}`,
    `<b>Yetkazib berish xizmati:</b> ${formatCurrencyUZS(deliveryFee)}`,
    `<b>Umumiy buyurtma summasi:</b> <b>${formatCurrencyUZS(totalAmount)}</b>`,
    `────────────────────`,
    `<b>To‘lov usuli:</b> ${formatPaymentMethodLabel(method)}`,
    `<b>Naqd pul (Cash):</b> ${formatCurrencyUZS(cashAmount)}`,
    `<b>Bank kartasi (Card):</b> ${formatCurrencyUZS(cardAmount)}`,
    `<b>Onlayn to‘lov (Online):</b> ${formatCurrencyUZS(onlineAmount)}`
  ].join('\n');
}

/**
 * Formats Courier Telegram Bot message and inline keyboard
 */
export function buildCourierAssignmentPayload(order, courier) {
  const courierFullName = [courier.lastName, courier.firstName, courier.fatherName]
    .filter(Boolean)
    .join(' ');

  const text = [
    `<b>YANGI YETKAZIB BERISH SO‘ROVI</b>`,
    `────────────────────`,
    `<b>Buyurtma:</b> #${order.orderNumber}`,
    `<b>Biriktirilgan kuryer:</b> ${courierFullName}`,
    `<b>Kuryer telefoni:</b> ${courier.phone}`,
    ``,
    `<b>Restoran:</b> ${order.restaurantName}`,
    `<b>Olib ketish manzili:</b> ${order.restaurantAddress || 'Restoran asosiy filiali'}`,
    ``,
    `<b>Mijoz:</b> ${order.customerName}`,
    `<b>Mijoz telefoni:</b> ${order.customerPhone}`,
    `<b>Yetkazish manzili:</b> ${order.deliveryAddress}`,
    order.instructions ? `<b>Maxsus izoh:</b> ${order.instructions}` : null,
    ``,
    `<b>Yetkazish haqi:</b> ${formatCurrencyUZS(order.deliveryFee)}`,
    `<b>Jami summa:</b> ${formatCurrencyUZS(order.totalAmount)}`,
    `<b>To‘lov usuli:</b> ${formatPaymentMethodLabel(order.paymentMethod)}`
  ]
    .filter(Boolean)
    .join('\n');

  const reply_markup = {
    inline_keyboard: [
      [
        {
          text: 'Buyurtmani qabul qilish (Accept)',
          callback_data: `courier:accept:${order.orderNumber}:${courier.id}`
        },
        {
          text: 'Rad etish (Reject)',
          callback_data: `courier:reject:${order.orderNumber}:${courier.id}`
        }
      ],
      [
        {
          text: 'Olib ketildi (Picked up)',
          callback_data: `courier:picked_up:${order.orderNumber}:${courier.id}`
        },
        {
          text: 'Yo‘lda (On the way)',
          callback_data: `courier:on_the_way:${order.orderNumber}:${courier.id}`
        }
      ],
      [
        {
          text: 'Yetkazib berildi (Delivered)',
          callback_data: `courier:delivered:${order.orderNumber}:${courier.id}`
        }
      ]
    ]
  };

  return { text, reply_markup };
}

/**
 * Sends a message via Telegram Bot API safely from the server
 */
export async function sendTelegramApiMessage({ botType, chatId, text, replyMarkup }) {
  const token =
    botType === 'courier'
      ? (process.env.TELEGRAM_COURIER_BOT_TOKEN || '').trim()
      : (process.env.TELEGRAM_MAIN_BOT_TOKEN || '').trim();

  if (!token || PLACEHOLDER_TOKENS.has(token)) {
    return {
      sent: false,
      mode: 'demo-simulated',
      reason: `Server environment variable ${
        botType === 'courier' ? 'TELEGRAM_COURIER_BOT_TOKEN' : 'TELEGRAM_MAIN_BOT_TOKEN'
      } is not configured.`
    };
  }

  if (!chatId) {
    return {
      sent: false,
      mode: 'demo-simulated',
      reason: 'Target Telegram chat_id / channel_id is not configured.'
    };
  }

  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      return {
        sent: false,
        mode: 'telegram-api-response',
        reason: data.description || 'Telegram API rejected message (verify bot admin rights in channel).',
        statusCode: response.status
      };
    }

    return {
      sent: true,
      mode: 'live-telegram',
      messageId: data.result?.message_id
    };
  } catch (err) {
    return {
      sent: false,
      mode: 'network-fallback',
      reason: err instanceof Error ? err.message : 'Network error reaching Telegram API'
    };
  }
}
