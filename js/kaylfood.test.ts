import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { calculateCartTotals, canAddProductToCart, isValidUzbekPhone } from './utils.js';
import { validateAndBuildOrder } from '../netlify/functions/_shared/db-adapter.js';
import {
  buildOrderChannelMessage,
  buildFinanceChannelMessage,
  buildCourierAssignmentPayload
} from '../netlify/functions/_shared/telegram-api.js';
import { handler as assignCourierHandler } from '../netlify/functions/assign-courier.js';
import { handler as courierActionHandler } from '../netlify/functions/courier-action.js';

test('Cart calculations compute subtotal, delivery fee, and total accurately', () => {
  const items = [
    { productId: 'prod-101', quantity: 2, unitPrice: 52000 },
    { productId: 'prod-103', quantity: 1, unitPrice: 14000 }
  ];
  const result = calculateCartTotals(items, 15000);
  assert.equal(result.itemCount, 3);
  assert.equal(result.subtotal, 118000);
  assert.equal(result.deliveryFee, 15000);
  assert.equal(result.total, 133000);
});

test('Single-restaurant cart guard prevents mixing products from different restaurants', () => {
  const existingItems = [{ productId: 'prod-101', restaurantId: 'rest-1', quantity: 1 }];
  const sameRest = canAddProductToCart('rest-1', existingItems, 'rest-1');
  assert.equal(sameRest.allowed, true);

  const diffRest = canAddProductToCart('rest-1', existingItems, 'rest-2');
  assert.equal(diffRest.allowed, false);
});

test('Server-side order validator ignores tampered client prices and computes exact Channel B finance breakdown', () => {
  const tamperedPayload = {
    orderNumber: 'KF-900111',
    restaurantId: 'rest-1',
    customerName: 'Sardor Aliyev',
    customerPhone: '+998 90 123 45 67',
    deliveryAddress: 'Toshkent sh., Yunusobod 7-dahasi, 12-uy',
    paymentMethod: 'online',
    items: [
      // Client tries to submit price = 1 so'm for prod-101 (canonical price is 52000)
      { productId: 'prod-101', quantity: 2, unitPrice: 1, modifierExtra: 0 }
    ]
  };

  const validation = validateAndBuildOrder(tamperedPayload);
  assert.equal(validation.valid, true);
  assert.ok(validation.order);
  assert.equal(validation.order.subtotal, 104000);
  assert.equal(validation.order.deliveryFee, 15000);
  assert.equal(validation.order.totalAmount, 119000);

  // Verify Channel B financial breakdown is never fake and reflects online payment
  assert.equal(validation.order.financeBreakdown.cashAmount, 0);
  assert.equal(validation.order.financeBreakdown.cardAmount, 0);
  assert.equal(validation.order.financeBreakdown.onlineAmount, 119000);

  const channelAMsg = buildOrderChannelMessage(validation.order);
  const channelBMsg = buildFinanceChannelMessage(validation.order);
  assert.ok(channelAMsg.includes('KF-900111'));
  assert.ok(channelBMsg.includes('119'));
});

test('RBAC & Courier Security: Only restaurant/admin can assign courier, and only assigned courier can update status', async () => {
  // 1. Customer role attempting to assign courier -> 403 Forbidden
  const forbiddenRes = await assignCourierHandler({
    httpMethod: 'POST',
    headers: { 'x-kaylfood-role': 'customer' },
    body: JSON.stringify({ orderNumber: 'KF-900111', courierId: 'cour-1' })
  });
  assert.equal(forbiddenRes.statusCode, 403);

  // 2. Restaurant role assigning cour-1 -> 200 OK
  const assignRes = await assignCourierHandler({
    httpMethod: 'POST',
    headers: { 'x-kaylfood-role': 'restaurant' },
    body: JSON.stringify({ orderNumber: 'KF-900111', courierId: 'cour-1' })
  });
  assert.equal(assignRes.statusCode, 200);
  const assignBody = JSON.parse(assignRes.body);
  assert.equal(assignBody.status, 'Courier assigned');
  assert.equal(assignBody.courier.id, 'cour-1');

  // 3. Different courier (cour-2) attempting to update cour-1's delivery -> 403 Forbidden
  const wrongCourierRes = await courierActionHandler({
    httpMethod: 'POST',
    headers: { 'x-kaylfood-role': 'courier' },
    body: JSON.stringify({ orderNumber: 'KF-900111', courierId: 'cour-2', action: 'picked_up' })
  });
  assert.equal(wrongCourierRes.statusCode, 403);

  // 4. Assigned courier (cour-1) updating status -> 200 OK
  const validCourierRes = await courierActionHandler({
    httpMethod: 'POST',
    headers: { 'x-kaylfood-role': 'courier' },
    body: JSON.stringify({ orderNumber: 'KF-900111', courierId: 'cour-1', action: 'picked_up' })
  });
  assert.equal(validCourierRes.statusCode, 200);
  const validBody = JSON.parse(validCourierRes.body);
  assert.equal(validBody.status, 'Courier picked up the order');
});

test('No Telegram bot tokens are exposed in any frontend HTML, CSS, or JS files', () => {
  const frontendFiles = [
    'index.html',
    'login.html',
    'register.html',
    'restaurant.html',
    'checkout.html',
    'tracking.html',
    'customer/profile.html',
    'restaurant-dashboard/index.html',
    'courier-dashboard/index.html',
    'admin/index.html',
    'js/app.js',
    'js/telegram-service.js',
    'js/data.js',
    'js/checkout.js'
  ];

  for (const relPath of frontendFiles) {
    const content = fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
    assert.equal(content.includes('8854624044:'), false, `Secret token leaked in ${relPath}`);
    assert.equal(content.includes('8960586822:'), false, `Courier token leaked in ${relPath}`);
  }
});
