import { validateAndBuildOrder, getDatabaseMode } from './_shared/db-adapter.js';
import {
  buildOrderChannelMessage,
  buildFinanceChannelMessage,
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
    const payload = JSON.parse(event.body || '{}');
    const validation = validateAndBuildOrder(payload);

    if (!validation.valid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, error: validation.error })
      };
    }

    const order = validation.order;
    const channelAMessage = buildOrderChannelMessage(order);
    const channelBMessage = buildFinanceChannelMessage(order);

    const ordersChannelId = (process.env.TELEGRAM_ORDERS_CHANNEL_ID || '').trim();
    const financeChannelId = (process.env.TELEGRAM_FINANCE_CHANNEL_ID || '').trim();

    const [ordersResult, financeResult] = await Promise.all([
      sendTelegramApiMessage({
        botType: 'main',
        chatId: ordersChannelId,
        text: channelAMessage
      }),
      sendTelegramApiMessage({
        botType: 'main',
        chatId: financeChannelId,
        text: channelBMessage
      })
    ]);

    const envCheck = validateTelegramEnv('main');

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        ok: true,
        databaseMode: getDatabaseMode(),
        telegramConfigured: envCheck.configured,
        order,
        notifications: {
          channelA_orders: {
            channel: 'Channel A — Main Orders',
            payloadPreview: channelAMessage.replace(/<[^>]+>/g, ''),
            delivery: ordersResult
          },
          channelB_finance: {
            channel: 'Channel B — Financial Reports',
            financeBreakdown: order.financeBreakdown,
            payloadPreview: channelBMessage.replace(/<[^>]+>/g, ''),
            delivery: financeResult
          }
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        error: 'Server error while processing order creation.',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}
