import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

// Import Netlify Serverless Function Handlers
import { handler as createOrderHandler } from './netlify/functions/create-order.js';
import { handler as sendOrderNotificationHandler } from './netlify/functions/send-order-notification.js';
import { handler as sendFinanceNotificationHandler } from './netlify/functions/send-finance-notification.js';
import { handler as assignCourierHandler } from './netlify/functions/assign-courier.js';
import { handler as courierActionHandler } from './netlify/functions/courier-action.js';
import { handler as telegramWebhookHandler } from './netlify/functions/telegram-webhook.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const functionRegistry: Record<string, (event: any) => Promise<any>> = {
  'create-order': createOrderHandler,
  'send-order-notification': sendOrderNotificationHandler,
  'send-finance-notification': sendFinanceNotificationHandler,
  'assign-courier': assignCourierHandler,
  'courier-action': courierActionHandler,
  'telegram-webhook': telegramWebhookHandler
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // Adapter route to execute Netlify Functions locally & in production container
  const invokeNetlifyFunction = async (req: express.Request, res: express.Response) => {
    const fnName = String(req.params.fn || '').replace(/\.js$/, '');
    const fnHandler = functionRegistry[fnName];

    if (!fnHandler) {
      res.status(404).json({ ok: false, error: `Netlify function "${fnName}" not found.` });
      return;
    }

    try {
      const event = {
        httpMethod: req.method,
        headers: req.headers,
        queryStringParameters: req.query,
        body: req.body ? JSON.stringify(req.body) : '{}'
      };

      const result = await fnHandler(event);
      if (result.headers) {
        for (const [k, v] of Object.entries(result.headers)) {
          res.setHeader(k, String(v));
        }
      }
      res.status(result.statusCode || 200).send(result.body);
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'Internal function execution error',
        details: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  app.all('/.netlify/functions/:fn', invokeNetlifyFunction);
  app.all('/api/:fn', invokeNetlifyFunction);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'mpa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.use(express.static(__dirname));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KaylFood server listening on http://localhost:${PORT}`);
  });
}

startServer();
