import { validateAndBuildOrder, getSavedOrder } from './_shared/db-adapter.js';
import {
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
    const body = JSON.parse(event.body || '{}');
    let order = body.orderNumber ? getSavedOrder(body.orderNumber) : null;

    if (!order) {
      const validated = validateAndBuildOrder(body.order || body);
      if (!validated.valid) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ ok: false, error: validated.error })
        };
      }
      order = validated.order;
    }

    const envStatus = validateTelegramEnv('finance');
    const messageHtml = buildFinanceChannelMessage(order);
    const financeChannelId = (process.env.TELEGRAM_FINANCE_CHANNEL_ID || '').trim();

    const result = await sendTelegramApiMessage({
      botType: 'main',
      chatId: financeChannelId,
      text: messageHtml
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        channel: 'TELEGRAM_FINANCE_CHANNEL_ID',
        envConfigured: envStatus.configured,
        missingEnvVars: envStatus.missing,
        orderNumber: order.orderNumber,
        financeBreakdown: order.financeBreakdown,
        payloadPreview: messageHtml.replace(/<[^>]+>/g, ''),
        delivery: result
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        error: 'Failed to process Channel B financial notification.',
        details: err instanceof Error ? err.message : 'Unknown error'
      })
    };
  }
}
