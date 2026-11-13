import { handler as courierActionHandler } from './courier-action.js';
import { sendTelegramApiMessage } from './_shared/telegram-api.js';

/**
 * Processes incoming Telegram Courier Bot updates (callback_query & /start command)
 * Configure webhook via:
 * https://api.telegram.org/bot<TELEGRAM_COURIER_BOT_TOKEN>/setWebhook?url=https://<DOMAIN>/.netlify/functions/telegram-webhook
 */
export async function handler(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        service: 'KaylFood Telegram Courier Bot Webhook',
        status: 'Ready to receive Telegram POST updates'
      })
    };
  }

  try {
    const update = JSON.parse(event.body || '{}');

    // Handle /start command from courier in Telegram
    if (update.message && update.message.text) {
      const chatId = update.message.chat?.id;
      const text = String(update.message.text).trim();

      if (text.startsWith('/start') && chatId) {
        await sendTelegramApiMessage({
          botType: 'courier',
          chatId,
          text: [
            `👋 <b>Assalomu alaykum! KaylFood Kuryer Botiga xush kelibsiz.</b>`,
            ``,
            `Sizning Telegram Chat ID raqamingiz: <code>${chatId}</code>`,
            `Ushbu ID orqali restoranlardan biriktirilgan yangi buyurtmalarni qabul qilishingiz va holatini yangilashingiz mumkin.`
          ].join('\n')
        });
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, handled: 'message' })
      };
    }

    // Handle Inline Keyboard callback_query: "courier:<action>:<orderNumber>:<courierId>"
    if (update.callback_query && update.callback_query.data) {
      const dataParts = String(update.callback_query.data).split(':');
      if (dataParts[0] === 'courier' && dataParts.length >= 4) {
        const [, action, orderNumber, courierId] = dataParts;
        const syntheticEvent = {
          httpMethod: 'POST',
          headers: { 'x-kaylfood-role': 'courier' },
          body: JSON.stringify({ action, orderNumber, courierId })
        };

        const actionRes = await courierActionHandler(syntheticEvent);
        return {
          statusCode: 200,
          headers,
          body: actionRes.body
        };
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, handled: 'ignored' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        error: 'Webhook processing error',
        details: err instanceof Error ? err.message : 'Unknown error'
      })
    };
  }
}
