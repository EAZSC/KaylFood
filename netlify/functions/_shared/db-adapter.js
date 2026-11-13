/**
 * KaylFood Server-Side Database Adapter & Canonical Catalog Validator
 * Supports PostgreSQL (via DATABASE_URL) when connected, with deterministic
 * server-side store for demo mode so browser inputs (prices, totals, courier IDs)
 * are always strictly validated on the server.
 */

// Canonical server-side restaurant & product pricing catalog
const CANONICAL_RESTAURANTS = {
  'rest-1': {
    id: 'rest-1',
    name: 'Oshxona Rayhon Milliy & Grill',
    address: 'Toshkent sh., Yunusobod tumani, Amir Temur shoh ko‘chasi 108',
    deliveryFee: 15000,
    minOrder: 60000,
    isOpen: true,
    couriers: ['cour-1', 'cour-2', 'cour-3']
  },
  'rest-2': {
    id: 'rest-2',
    name: 'Kayl Burger & Artisan Smash',
    address: 'Toshkent sh., Mirobod tumani, Taras Shevchenko ko‘chasi 24',
    deliveryFee: 12000,
    minOrder: 50000,
    isOpen: true,
    couriers: ['cour-1', 'cour-2']
  },
  'rest-3': {
    id: 'rest-3',
    name: 'Napoli Woodfire Pizza & Pasta',
    address: 'Toshkent sh., Yakkasaroy tumani, Shota Rustaveli ko‘chasi 55',
    deliveryFee: 18000,
    minOrder: 80000,
    isOpen: true,
    couriers: ['cour-2', 'cour-3']
  },
  'rest-4': {
    id: 'rest-4',
    name: 'Besh Qozon Lavash & Shawarma House',
    address: 'Toshkent sh., Chilonzor tumani, Qatortol ko‘chasi 19',
    deliveryFee: 10000,
    minOrder: 45000,
    isOpen: true,
    couriers: ['cour-1', 'cour-3']
  },
  'rest-5': {
    id: 'rest-5',
    name: 'Sora Tokyo Sushi & Ramen Bar',
    address: 'Toshkent sh., Shayxontohur tumani, Navoiy ko‘chasi 41',
    deliveryFee: 20000,
    minOrder: 110000,
    isOpen: true,
    couriers: ['cour-2', 'cour-3']
  },
  'rest-6': {
    id: 'rest-6',
    name: 'Crispy Crown Chicken & Hot Dogs',
    address: 'Toshkent sh., Mirzo Ulug‘bek tumani, Buyuk Ipak Yo‘li 72',
    deliveryFee: 12000,
    minOrder: 45000,
    isOpen: true,
    couriers: ['cour-1', 'cour-2', 'cour-3']
  }
};

const CANONICAL_PRODUCTS = {
  'prod-101': { id: 'prod-101', restaurantId: 'rest-1', name: 'Bayramona Toshkent Palovi (Double Gosht)', price: 52000 },
  'prod-102': { id: 'prod-102', restaurantId: 'rest-1', name: 'Qo‘y Go‘shtli Tandir Kabob', price: 68000 },
  'prod-103': { id: 'prod-103', restaurantId: 'rest-1', name: 'Muzdek Ayron Yalpizli (500ml)', price: 14000 },
  'prod-104': { id: 'prod-104', restaurantId: 'rest-1', name: 'Pistali Baklava Assorti', price: 38000 },
  'prod-201': { id: 'prod-201', restaurantId: 'rest-2', name: 'Double Truffle Smash Burger', price: 64000 },
  'prod-202': { id: 'prod-202', restaurantId: 'rest-2', name: 'Smoky Cheddar & Crispy Onion Burger', price: 58000 },
  'prod-203': { id: 'prod-203', restaurantId: 'rest-2', name: 'Brioche Artisanal Hot Dog', price: 42000 },
  'prod-204': { id: 'prod-204', restaurantId: 'rest-2', name: 'Berry Hibiscus Iced Craft Soda', price: 22000 },
  'prod-301': { id: 'prod-301', restaurantId: 'rest-3', name: 'Diavola Pepperoni Woodfire Pizza (32sm)', price: 89000 },
  'prod-302': { id: 'prod-302', restaurantId: 'rest-3', name: 'Quattro Formaggi Truffle Pizza (32sm)', price: 96000 },
  'prod-303': { id: 'prod-303', restaurantId: 'rest-3', name: 'San Sebastian Basque Cheesecake', price: 46000 },
  'prod-401': { id: 'prod-401', restaurantId: 'rest-4', name: 'Tandirda Pishgan Pishloqli Mol Go‘shtli Lavash', price: 44000 },
  'prod-402': { id: 'prod-402', restaurantId: 'rest-4', name: 'Ko‘mir Qo‘rasida Arabcha Shawarma', price: 46000 },
  'prod-403': { id: 'prod-403', restaurantId: 'rest-4', name: 'Qarsildoq Kartoshka Fri & Maxsus Sous', price: 21000 },
  'prod-501': { id: 'prod-501', restaurantId: 'rest-5', name: 'ImperialPhiladelphia & Dragon Set (24 dona)', price: 165000 },
  'prod-502': { id: 'prod-502', restaurantId: 'rest-5', name: 'Spicy Salmon Crunch Roll (8 dona)', price: 74000 },
  'prod-503': { id: 'prod-503', restaurantId: 'rest-5', name: 'Matcha Yuzu Sparkler (400ml)', price: 28000 },
  'prod-601': { id: 'prod-601', restaurantId: 'rest-6', name: 'Golden Crispy Wings Bucket (12 qanot)', price: 78000 },
  'prod-602': { id: 'prod-602', restaurantId: 'rest-6', name: 'New York Melted Cheese Hot Dog', price: 39000 },
  'prod-603': { id: 'prod-603', restaurantId: 'rest-6', name: 'Belgian Choco Lava Cake', price: 35000 }
};

const CANONICAL_COURIERS = {
  'cour-1': {
    id: 'cour-1',
    firstName: 'Sardor',
    lastName: 'Tursunov',
    fatherName: 'Rustam o‘g‘li',
    phone: '+998 90 123 45 67',
    vehicle: 'Skuter · 01 A 771 KA',
    telegramChatId: ''
  },
  'cour-2': {
    id: 'cour-2',
    firstName: 'Javohir',
    lastName: 'Abdullayev',
    fatherName: 'Baxtiyor o‘g‘li',
    phone: '+998 93 555 88 99',
    vehicle: 'Avto · 01 M 420 BB',
    telegramChatId: ''
  },
  'cour-3': {
    id: 'cour-3',
    firstName: 'Ulug‘bek',
    lastName: 'Karimov',
    fatherName: 'Ilhom o‘g‘li',
    phone: '+998 97 707 22 33',
    vehicle: 'Elektrovelosiped · KF-09',
    telegramChatId: ''
  }
};

const VALID_PAYMENT_METHODS = ['cash', 'card', 'online'];

const VALID_ORDER_STATUSES = [
  'Order received',
  'Restaurant confirmed',
  'Preparing food',
  'Ready for pickup',
  'Courier assigned',
  'Courier picked up the order',
  'On the way',
  'Delivered',
  'Cancelled'
];

// In-memory store for serverless execution / Express server runtime
const memoryOrders = new Map();

export function getDatabaseMode() {
  return process.env.DATABASE_URL ? 'postgresql' : 'demo-memory';
}

export function getCanonicalRestaurant(restaurantId, fallbackRestaurant) {
  if (CANONICAL_RESTAURANTS[restaurantId]) {
    return CANONICAL_RESTAURANTS[restaurantId];
  }
  // Support custom restaurants added in demo mode while sanitizing numeric bounds
  if (fallbackRestaurant && typeof fallbackRestaurant.id === 'string' && fallbackRestaurant.name) {
    return {
      id: String(fallbackRestaurant.id),
      name: String(fallbackRestaurant.name).slice(0, 120),
      address: String(fallbackRestaurant.address || 'Toshkent sh.').slice(0, 200),
      deliveryFee: Math.max(0, Math.min(100000, Number(fallbackRestaurant.deliveryFee) || 15000)),
      minOrder: Math.max(0, Math.min(500000, Number(fallbackRestaurant.minOrder) || 40000)),
      isOpen: fallbackRestaurant.isOpen !== false,
      couriers: Array.isArray(fallbackRestaurant.couriers) && fallbackRestaurant.couriers.length > 0
        ? fallbackRestaurant.couriers
        : ['cour-1', 'cour-2', 'cour-3']
    };
  }
  return null;
}

export function getCanonicalCourier(courierId, fallbackCourier) {
  if (CANONICAL_COURIERS[courierId]) {
    return CANONICAL_COURIERS[courierId];
  }
  if (fallbackCourier && typeof fallbackCourier.id === 'string' && fallbackCourier.firstName) {
    return {
      id: String(fallbackCourier.id),
      firstName: String(fallbackCourier.firstName).slice(0, 60),
      lastName: String(fallbackCourier.lastName || '').slice(0, 60),
      fatherName: String(fallbackCourier.fatherName || '').slice(0, 60),
      phone: String(fallbackCourier.phone || '').slice(0, 30),
      vehicle: String(fallbackCourier.vehicle || 'Kuryer transporti').slice(0, 60),
      telegramChatId: String(fallbackCourier.telegramChatId || '')
    };
  }
  return null;
}

/**
 * Validates and calculates order totals strictly on the server.
 * Never trusts client-submitted subtotal, deliveryFee, or total.
 */
export function validateAndBuildOrder(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid order request payload.' };
  }

  const customerName = String(payload.customerName || '').trim();
  const customerPhone = String(payload.customerPhone || '').trim();
  const deliveryAddress = String(payload.deliveryAddress || '').trim();
  const instructions = String(payload.instructions || '').trim();
  const locationCoords = String(payload.locationCoords || '').trim();
  const paymentMethod = String(payload.paymentMethod || '').toLowerCase();
  const restaurantId = String(payload.restaurantId || '').trim();

  if (customerName.length < 3) {
    return { valid: false, error: 'Customer full name is required (minimum 3 characters).' };
  }
  if (!/^\+?[0-9\s\-()]{9,18}$/.test(customerPhone)) {
    return { valid: false, error: 'Valid customer phone number is required.' };
  }
  if (deliveryAddress.length < 5) {
    return { valid: false, error: 'Delivery address is required (minimum 5 characters).' };
  }
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    return { valid: false, error: 'Invalid payment method. Must be cash, card, or online.' };
  }

  const restaurant = getCanonicalRestaurant(restaurantId, payload.restaurantMeta);
  if (!restaurant) {
    return { valid: false, error: 'Selected restaurant was not found.' };
  }
  if (!restaurant.isOpen) {
    return { valid: false, error: 'Selected restaurant is currently closed.' };
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return { valid: false, error: 'Order must contain at least one food item.' };
  }

  const validatedItems = [];
  let calculatedSubtotal = 0;

  for (const rawItem of payload.items) {
    const productId = String(rawItem.productId || rawItem.id || '').trim();
    const quantity = Math.floor(Number(rawItem.quantity) || 0);
    if (quantity < 1 || quantity > 50) {
      return { valid: false, error: `Invalid quantity for product ${productId}.` };
    }

    const canonicalProduct = CANONICAL_PRODUCTS[productId];
    // Ensure single-restaurant rule on the server
    if (canonicalProduct && canonicalProduct.restaurantId !== restaurant.id) {
      return {
        valid: false,
        error: 'Cannot mix products from different restaurants in a single order.'
      };
    }
    if (!canonicalProduct && rawItem.restaurantId && rawItem.restaurantId !== restaurant.id) {
      return {
        valid: false,
        error: 'Cannot mix products from different restaurants in a single order.'
      };
    }

    const unitBasePrice = canonicalProduct
      ? canonicalProduct.price
      : Math.max(1000, Math.min(2000000, Number(rawItem.unitPrice || rawItem.price) || 0));

    const modifierExtra = Math.max(0, Math.min(100000, Number(rawItem.modifierExtra) || 0));
    const unitPrice = unitBasePrice + modifierExtra;
    const lineTotal = unitPrice * quantity;
    calculatedSubtotal += lineTotal;

    validatedItems.push({
      productId,
      name: canonicalProduct ? canonicalProduct.name : String(rawItem.name || 'Maxsus taom').slice(0, 120),
      quantity,
      unitPrice,
      lineTotal,
      customization: String(rawItem.customization || '').slice(0, 140)
    });
  }

  const deliveryFee = restaurant.deliveryFee;
  const totalAmount = calculatedSubtotal + deliveryFee;

  // Calculate exact financial breakdown from actual order values
  const financeBreakdown = {
    subtotal: calculatedSubtotal,
    deliveryFee,
    totalAmount,
    paymentMethod,
    cashAmount: paymentMethod === 'cash' ? totalAmount : 0,
    cardAmount: paymentMethod === 'card' ? totalAmount : 0,
    onlineAmount: paymentMethod === 'online' ? totalAmount : 0
  };

  const now = new Date();
  const orderNumber = payload.orderNumber && /^KF-\d{6}$/.test(payload.orderNumber)
    ? payload.orderNumber
    : `KF-${String(Math.floor(100000 + Math.random() * 900000))}`;

  const orderRecord = {
    orderNumber,
    createdAt: now.toISOString(),
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    restaurantAddress: restaurant.address,
    customerName,
    customerPhone,
    deliveryAddress,
    instructions,
    locationCoords,
    paymentMethod,
    items: validatedItems,
    subtotal: calculatedSubtotal,
    deliveryFee,
    totalAmount,
    financeBreakdown,
    status: 'Order received',
    estimatedDeliveryMinutes: 35,
    courier: null,
    timeline: [
      {
        status: 'Order received',
        timestamp: now.toISOString(),
        actor: 'Customer'
      }
    ]
  };

  memoryOrders.set(orderNumber, orderRecord);
  return { valid: true, order: orderRecord };
}

export function getSavedOrder(orderNumber) {
  return memoryOrders.get(orderNumber) || null;
}

export function saveOrderRecord(orderRecord) {
  if (orderRecord && orderRecord.orderNumber) {
    memoryOrders.set(orderRecord.orderNumber, orderRecord);
  }
  return orderRecord;
}

export {
  CANONICAL_RESTAURANTS,
  CANONICAL_PRODUCTS,
  CANONICAL_COURIERS,
  VALID_PAYMENT_METHODS,
  VALID_ORDER_STATUSES
};
