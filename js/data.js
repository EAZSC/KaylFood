/**
 * KaylFood — Deterministic Marketplace Seed Data
 * Includes all 10 required food categories, 6 restaurants, 20 products,
 * 3 couriers (with First name, Last name, Father's name, Phone), and initial orders.
 */

export const IMAGE_ASSETS = {
  HERO_FEAST: '/src/assets/images/hero_halal_fastfood_feast_1794573515889.jpg',
  BURGER_COMBO: '/src/assets/images/food_smash_burger_combo_1794573036471.jpg',
  WOODFIRE_PIZZA: '/src/assets/images/food_woodfire_pizza_1794573038871.jpg',
  LAVASH_SHAWARMA: '/src/assets/images/food_lavash_shawarma_grill_1794573040276.jpg',
  CHICKEN_SUSHI: '/src/assets/images/food_crispy_chicken_sushi_1794573040532.jpg'
};

export function getRestaurantImageUrl(restaurant) {
  if (restaurant?.image) return restaurant.image;
  const id = String(restaurant?.id || '');
  if (id === 'rest-2') return IMAGE_ASSETS.BURGER_COMBO;
  if (id === 'rest-3') return IMAGE_ASSETS.WOODFIRE_PIZZA;
  if (id === 'rest-4' || id === 'rest-1') return IMAGE_ASSETS.LAVASH_SHAWARMA;
  if (id === 'rest-5' || id === 'rest-6') return IMAGE_ASSETS.CHICKEN_SUSHI;

  const cats = Array.isArray(restaurant?.categories) ? restaurant.categories : [];
  if (cats.includes('Burgers') || cats.includes('Hot dogs')) return IMAGE_ASSETS.BURGER_COMBO;
  if (cats.includes('Pizza')) return IMAGE_ASSETS.WOODFIRE_PIZZA;
  if (cats.includes('Lavash') || cats.includes('Shawarma')) return IMAGE_ASSETS.LAVASH_SHAWARMA;
  if (cats.includes('Sushi') || cats.includes('Chicken')) return IMAGE_ASSETS.CHICKEN_SUSHI;
  return IMAGE_ASSETS.HERO_FEAST;
}

export function getRestaurantMonogram(restaurant) {
  const name = String(restaurant?.name || 'KF').trim();
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getProductImageUrl(product) {
  if (product?.image) return product.image;
  const id = String(product?.id || '');
  const cat = String(product?.category || '');

  if (id === 'prod-101' || id === 'prod-403') return IMAGE_ASSETS.HERO_FEAST;
  if (id === 'prod-102' || id === 'prod-401' || id === 'prod-402') return IMAGE_ASSETS.LAVASH_SHAWARMA;
  if (id === 'prod-201' || id === 'prod-202' || id === 'prod-203' || id === 'prod-602') return IMAGE_ASSETS.BURGER_COMBO;
  if (id === 'prod-301' || id === 'prod-302' || id === 'prod-303' || id === 'prod-104' || id === 'prod-603') return IMAGE_ASSETS.WOODFIRE_PIZZA;
  if (id === 'prod-501' || id === 'prod-502' || id === 'prod-503' || id === 'prod-601' || id === 'prod-204' || id === 'prod-103') return IMAGE_ASSETS.CHICKEN_SUSHI;

  if (cat === 'Burgers' || cat === 'Hot dogs') return IMAGE_ASSETS.BURGER_COMBO;
  if (cat === 'Pizza' || cat === 'Desserts') return IMAGE_ASSETS.WOODFIRE_PIZZA;
  if (cat === 'Lavash' || cat === 'Shawarma') return IMAGE_ASSETS.LAVASH_SHAWARMA;
  if (cat === 'Chicken' || cat === 'Sushi' || cat === 'Drinks') return IMAGE_ASSETS.CHICKEN_SUSHI;
  return IMAGE_ASSETS.HERO_FEAST;
}

export const SEED_CATEGORIES = [
  { id: 'all', name: 'Barcha taomlar', slug: 'all' },
  { id: 'cat-burgers', name: 'Burgers', slug: 'Burgers' },
  { id: 'cat-pizza', name: 'Pizza', slug: 'Pizza' },
  { id: 'cat-lavash', name: 'Lavash', slug: 'Lavash' },
  { id: 'cat-shawarma', name: 'Shawarma', slug: 'Shawarma' },
  { id: 'cat-hotdogs', name: 'Hot dogs', slug: 'Hot dogs' },
  { id: 'cat-chicken', name: 'Chicken', slug: 'Chicken' },
  { id: 'cat-sushi', name: 'Sushi', slug: 'Sushi' },
  { id: 'cat-drinks', name: 'Drinks', slug: 'Drinks' },
  { id: 'cat-desserts', name: 'Desserts', slug: 'Desserts' },
  { id: 'cat-other', name: 'Other food', slug: 'Other food' }
];

export const ORDER_STATUS_FLOW = [
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

export const SEED_RESTAURANTS = [
  {
    id: 'rest-1',
    name: 'Oshxona Rayhon Milliy & Grill',
    cuisine: 'Other food · Grill · Desserts',
    categories: ['Other food', 'Drinks', 'Desserts'],
    rating: 4.9,
    reviewCount: 412,
    deliveryTime: '25–35 daq',
    deliveryFee: 15000,
    minOrder: 60000,
    isOpen: true,
    featured: true,
    recommended: true,
    openingHours: '09:00 – 23:30',
    phone: '+998 71 200 11 22',
    address: 'Toshkent sh., Yunusobod tumani, Amir Temur shoh ko‘chasi 108',
    description: 'An’anaviy Toshkent bayramona palovi, ko‘mirda pishgan sarxil kaboblar va sharqona shirinliklar.',
    specialOffer: '120 000 so‘mdan yuqori buyurtmalarga muzdek ayron sovg‘a',
    couriers: ['cour-1', 'cour-2', 'cour-3']
  },
  {
    id: 'rest-2',
    name: 'Kayl Burger & Artisan Smash',
    cuisine: 'Burgers · Hot dogs · Drinks',
    categories: ['Burgers', 'Hot dogs', 'Drinks'],
    rating: 4.8,
    reviewCount: 530,
    deliveryTime: '20–30 daq',
    deliveryFee: 12000,
    minOrder: 50000,
    isOpen: true,
    featured: true,
    recommended: true,
    openingHours: '10:00 – 02:00',
    phone: '+998 71 200 33 44',
    address: 'Toshkent sh., Mirobod tumani, Taras Shevchenko ko‘chasi 24',
    description: '100% marmar mol go‘shtidan tayyorlangan smash burgerlar, briosh bulochkalari va mualliflik souslari.',
    specialOffer: 'Kombo buyurtmalarga 15% chegirma',
    couriers: ['cour-1', 'cour-2']
  },
  {
    id: 'rest-3',
    name: 'Napoli Woodfire Pizza & Pasta',
    cuisine: 'Pizza · Desserts · Drinks',
    categories: ['Pizza', 'Desserts', 'Drinks'],
    rating: 4.9,
    reviewCount: 289,
    deliveryTime: '30–40 daq',
    deliveryFee: 18000,
    minOrder: 80000,
    isOpen: true,
    featured: true,
    recommended: false,
    openingHours: '11:00 – 23:00',
    phone: '+998 71 200 55 66',
    address: 'Toshkent sh., Yakkasaroy tumani, Shota Rustaveli ko‘chasi 55',
    description: 'Haqiqiy o‘tinli pechda 400°C haroratda pishirilgan Neapolitan pitsalari va San-Sebastyan chizkeyklari.',
    specialOffer: '2 ta katta pitsa xarid qilganda yetkazib berish tekin',
    couriers: ['cour-2', 'cour-3']
  },
  {
    id: 'rest-4',
    name: 'Besh Qozon Lavash & Shawarma House',
    cuisine: 'Lavash · Shawarma · Drinks',
    categories: ['Lavash', 'Shawarma', 'Drinks'],
    rating: 4.7,
    reviewCount: 640,
    deliveryTime: '15–25 daq',
    deliveryFee: 10000,
    minOrder: 45000,
    isOpen: true,
    featured: false,
    recommended: true,
    openingHours: '08:30 – 03:00',
    phone: '+998 71 200 77 88',
    address: 'Toshkent sh., Chilonzor tumani, Qatortol ko‘chasi 19',
    description: 'Tandirdan yangi uzilgan pishloqli lavashlar va ko‘mir qo‘rasida pishgan sersuv arabcha shaurmalar.',
    specialOffer: 'Har bir 3-lavashga maxsus sarimsoqli sous bepul',
    couriers: ['cour-1', 'cour-3']
  },
  {
    id: 'rest-5',
    name: 'Sora Tokyo Sushi & Ramen Bar',
    cuisine: 'Sushi · Drinks · Other food',
    categories: ['Sushi', 'Drinks', 'Other food'],
    rating: 4.9,
    reviewCount: 198,
    deliveryTime: '35–45 daq',
    deliveryFee: 20000,
    minOrder: 110000,
    isOpen: true,
    featured: true,
    recommended: true,
    openingHours: '11:30 – 23:30',
    phone: '+998 71 200 99 00',
    address: 'Toshkent sh., Shayxontohur tumani, Navoiy ko‘chasi 41',
    description: 'Norvegiya lososi, premium Filadelfiya pishlog‘i va Tokio uslubidagi mualliflik roll to‘plamlari.',
    specialOffer: 'Sushi setlarga zanjabil, vasabi va 3 ta soya sousi kiritilgan',
    couriers: ['cour-2', 'cour-3']
  },
  {
    id: 'rest-6',
    name: 'Crispy Crown Chicken & Hot Dogs',
    cuisine: 'Chicken · Hot dogs · Desserts',
    categories: ['Chicken', 'Hot dogs', 'Desserts'],
    rating: 4.6,
    reviewCount: 315,
    deliveryTime: '20–30 daq',
    deliveryFee: 12000,
    minOrder: 45000,
    isOpen: false,
    featured: false,
    recommended: false,
    openingHours: '10:00 – 22:00',
    phone: '+998 71 205 12 34',
    address: 'Toshkent sh., Mirzo Ulug‘bek tumani, Buyuk Ipak Yo‘li 72',
    description: 'Oltinrang qarsildoq tovuq qanotchalari, Nyu-York uslubidagi pishloqli xot-doglar va shokoladli desertlar.',
    specialOffer: 'Oilaviy savatchaga 2 litr ichimlik qo‘shib beriladi',
    couriers: ['cour-1', 'cour-2', 'cour-3']
  }
];

export const SEED_PRODUCTS = [
  {
    id: 'prod-101',
    restaurantId: 'rest-1',
    name: 'Bayramona Toshkent Palovi (Double Go‘sht)',
    category: 'Other food',
    price: 52000,
    popular: true,
    available: true,
    description: 'Lazer guruchi, yumshoq mol go‘shti, sariq sabzi, no‘xat, kishmish va bedana tuxumi bilan.',
    customizations: [
      { label: 'Standart porsiya (420g)', extraPrice: 0 },
      { label: 'Qazi va qo‘shimcha go‘sht bilan', extraPrice: 16000 },
      { label: 'Achchiq qalampir va achichuk salat bilan', extraPrice: 8000 }
    ]
  },
  {
    id: 'prod-102',
    restaurantId: 'rest-1',
    name: 'Qo‘y Go‘shtli Tandir Kabob',
    category: 'Other food',
    price: 68000,
    popular: true,
    available: true,
    description: 'Archa shoxlarida dimlab pishirilgan sersuv qo‘y go‘shti, marinadlangan piyoz va tandir non bilan.',
    customizations: [
      { label: 'Standart 300g', extraPrice: 0 },
      { label: 'Qo‘shimcha ko‘katli sous bilan', extraPrice: 5000 }
    ]
  },
  {
    id: 'prod-103',
    restaurantId: 'rest-1',
    name: 'Muzdek Ayron Yalpizli (500ml)',
    category: 'Drinks',
    price: 14000,
    popular: false,
    available: true,
    description: 'Tabiiy suzma va tog‘ yalpizidan tayyorlangan salqin ichimlik.',
    customizations: [{ label: '500 ml shisha idishda', extraPrice: 0 }]
  },
  {
    id: 'prod-104',
    restaurantId: 'rest-1',
    name: 'Pistali Baklava Assorti',
    category: 'Desserts',
    price: 38000,
    popular: false,
    available: true,
    description: 'Antep pistasi va tabiiy asal qiyomida tayyorlangan 4 bo‘lakli paxlava.',
    customizations: [
      { label: '4 bo‘lak (standart)', extraPrice: 0 },
      { label: 'Qaymoqli muzqaymoq bilan', extraPrice: 10000 }
    ]
  },
  {
    id: 'prod-201',
    restaurantId: 'rest-2',
    name: 'Double Truffle Smash Burger',
    category: 'Burgers',
    price: 64000,
    popular: true,
    available: true,
    description: 'Ikkita marmar mol go‘shti kotleti, chedder pishlog‘i, karamelize piyoz va qora tryufel sousi.',
    customizations: [
      { label: 'Standart Double', extraPrice: 0 },
      { label: 'Qo‘shimcha Chedder pishloq', extraPrice: 7000 },
      { label: 'Xalapenyo va dudlangan kurka go‘shti', extraPrice: 12000 }
    ]
  },
  {
    id: 'prod-202',
    restaurantId: 'rest-2',
    name: 'Smoky Cheddar & Crispy Onion Burger',
    category: 'Burgers',
    price: 58000,
    popular: true,
    available: true,
    description: 'Briosh bulochkasi, 180g mol go‘shti, qarsildoq piyoz halqalari va dudlangan BBQ sousi.',
    customizations: [
      { label: 'Standart', extraPrice: 0 },
      { label: 'Kartoshka fri bilan kombo', extraPrice: 15000 }
    ]
  },
  {
    id: 'prod-203',
    restaurantId: 'rest-2',
    name: 'Brioche Artisanal Hot Dog',
    category: 'Hot dogs',
    price: 42000,
    popular: false,
    available: true,
    description: 'Mol go‘shtli kolbasa, xantal-asal sousi, eritilgan chedder va tuzlangan bodring.',
    customizations: [
      { label: 'Standart', extraPrice: 0 },
      { label: 'Qo‘shimcha pishloq sousi', extraPrice: 6000 }
    ]
  },
  {
    id: 'prod-204',
    restaurantId: 'rest-2',
    name: 'Berry Hibiscus Iced Craft Soda',
    category: 'Drinks',
    price: 22000,
    popular: false,
    available: true,
    description: 'O‘rmon mevalari, gibiskus ekstrakti va laym sharbati qo‘shilgan mualliflik limonadi.',
    customizations: [{ label: '450 ml', extraPrice: 0 }]
  },
  {
    id: 'prod-301',
    restaurantId: 'rest-3',
    name: 'Diavola Pepperoni Woodfire Pizza (32sm)',
    category: 'Pizza',
    price: 89000,
    popular: true,
    available: true,
    description: 'San-Marsano pomidor sousi, Fior di Latte motsarella va halol mol go‘shtli pepperoni.',
    customizations: [
      { label: 'Yupqa Neapolitan xamir (32sm)', extraPrice: 0 },
      { label: 'Pishloqli bort bilan', extraPrice: 14000 }
    ]
  },
  {
    id: 'prod-302',
    restaurantId: 'rest-3',
    name: 'Quattro Formaggi Truffle Pizza (32sm)',
    category: 'Pizza',
    price: 96000,
    popular: false,
    available: true,
    description: 'Motsarella, Gorgonzola, Parmezan va Pekorino pishloqlari, oq tryufel yog‘i bilan.',
    customizations: [{ label: '32 sm standart', extraPrice: 0 }]
  },
  {
    id: 'prod-303',
    restaurantId: 'rest-3',
    name: 'San Sebastian Basque Cheesecake',
    category: 'Desserts',
    price: 46000,
    popular: true,
    available: true,
    description: 'Kremli pishloqdan tayyorlangan nozik chizkeyk, issiq Belgiya shokoladi bilan tortiladi.',
    customizations: [
      { label: 'Belgiya sutli shokoladi bilan', extraPrice: 0 },
      { label: 'Pistali krem bilan', extraPrice: 8000 }
    ]
  },
  {
    id: 'prod-401',
    restaurantId: 'rest-4',
    name: 'Tandirda Pishgan Pishloqli Mol Go‘shtli Lavash',
    category: 'Lavash',
    price: 44000,
    popular: true,
    available: true,
    description: 'Qarsildoq xamir, ko‘mirda pishgan mol go‘shti, motsarella pishlog‘i, pomidor va maxsus oq sous.',
    customizations: [
      { label: 'Standart', extraPrice: 0 },
      { label: 'Achchiq Xalapenyo bilan', extraPrice: 4000 },
      { label: 'Ikki hissa pishloq bilan', extraPrice: 7000 }
    ]
  },
  {
    id: 'prod-402',
    restaurantId: 'rest-4',
    name: 'Ko‘mir Qo‘rasida Arabcha Shawarma',
    category: 'Shawarma',
    price: 46000,
    popular: true,
    available: true,
    description: 'Arab pita nonida marinadlangan go‘sht, sarimsoqli toum sousi, tuzlangan bodring va kartoshka.',
    customizations: [
      { label: 'Standart', extraPrice: 0 },
      { label: 'Pishloqli', extraPrice: 6000 }
    ]
  },
  {
    id: 'prod-403',
    restaurantId: 'rest-4',
    name: 'Qarsildoq Kartoshka Fri & Maxsus Sous',
    category: 'Other food',
    price: 21000,
    popular: false,
    available: true,
    description: 'Oltinrang kartoshka fri, xushbo‘y ziravorlar va pishloqli sous bilan.',
    customizations: [{ label: 'Standart porsiya', extraPrice: 0 }]
  },
  {
    id: 'prod-501',
    restaurantId: 'rest-5',
    name: 'Imperial Philadelphia & Dragon Set (24 dona)',
    category: 'Sushi',
    price: 165000,
    popular: true,
    available: true,
    description: 'Filadelfiya Klassik (8), Golden Dragon (8) va Kanada Unagi (8) rollaridan iborat premium to‘plam.',
    customizations: [
      { label: '2 kishilik anjomlar bilan', extraPrice: 0 },
      { label: 'Qo‘shimcha Unagi va Spicy sous', extraPrice: 9000 }
    ]
  },
  {
    id: 'prod-502',
    restaurantId: 'rest-5',
    name: 'Spicy Salmon Crunch Roll (8 dona)',
    category: 'Sushi',
    price: 74000,
    popular: false,
    available: true,
    description: 'Norvegiya lososi, avokado, Filadelfiya pishlog‘i, tempura qarsildog‘i va kimchii sousi.',
    customizations: [{ label: '8 dona', extraPrice: 0 }]
  },
  {
    id: 'prod-503',
    restaurantId: 'rest-5',
    name: 'Matcha Yuzu Sparkler (400ml)',
    category: 'Drinks',
    price: 28000,
    popular: false,
    available: true,
    description: 'Yaponiya Uji matchasi va yuzu sitrusi asosidagi tetiklantiruvchi ichimlik.',
    customizations: [{ label: '400 ml', extraPrice: 0 }]
  },
  {
    id: 'prod-601',
    restaurantId: 'rest-6',
    name: 'Golden Crispy Wings Bucket (12 qanot)',
    category: 'Chicken',
    price: 78000,
    popular: true,
    available: true,
    description: 'Maxsus 11 xil ziravorli panirovkada qovurilgan qarsildoq tovuq qanotchalari.',
    customizations: [
      { label: 'Original', extraPrice: 0 },
      { label: 'Hot & Spicy glazur bilan', extraPrice: 5000 }
    ]
  },
  {
    id: 'prod-602',
    restaurantId: 'rest-6',
    name: 'New York Melted Cheese Hot Dog',
    category: 'Hot dogs',
    price: 39000,
    popular: false,
    available: true,
    description: 'Dudlangan sosiska, eritilgan chedder, qovurilgan piyoz va xantal sousi.',
    customizations: [{ label: 'Standart', extraPrice: 0 }]
  },
  {
    id: 'prod-603',
    restaurantId: 'rest-6',
    name: 'Belgian Choco Lava Cake',
    category: 'Desserts',
    price: 35000,
    popular: false,
    available: true,
    description: 'Ichidan issiq shokolad oqib chiquvchi Belgiya shokoladli fondani.',
    customizations: [{ label: 'Standart', extraPrice: 0 }]
  }
];

/**
 * Couriers — Requirement 10:
 * Must include First name, Last name, Father's name, and Phone number.
 */
export const SEED_COURIERS = [
  {
    id: 'cour-1',
    firstName: 'Sardor',
    lastName: 'Tursunov',
    fatherName: 'Rustam o‘g‘li',
    phone: '+998 90 123 45 67',
    vehicle: 'Skuter · 01 A 771 KA',
    status: 'available',
    completedDeliveries: 148,
    totalEarnings: 2220000
  },
  {
    id: 'cour-2',
    firstName: 'Javohir',
    lastName: 'Abdullayev',
    fatherName: 'Baxtiyor o‘g‘li',
    phone: '+998 93 555 88 99',
    vehicle: 'Avto · 01 M 420 BB',
    status: 'available',
    completedDeliveries: 215,
    totalEarnings: 3440000
  },
  {
    id: 'cour-3',
    firstName: 'Ulug‘bek',
    lastName: 'Karimov',
    fatherName: 'Ilhom o‘g‘li',
    phone: '+998 97 707 22 33',
    vehicle: 'Elektrovelosiped · KF-09',
    status: 'available',
    completedDeliveries: 94,
    totalEarnings: 1410000
  }
];

export const SEED_ORDERS = [
  {
    orderNumber: 'KF-842109',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    restaurantId: 'rest-1',
    restaurantName: 'Oshxona Rayhon Milliy & Grill',
    restaurantAddress: 'Toshkent sh., Yunusobod tumani, Amir Temur shoh ko‘chasi 108',
    customerName: 'Azizbek Rahimov',
    customerPhone: '+998 90 998 11 22',
    deliveryAddress: 'Toshkent sh., Yunusobod 4-dahasi, 18-uy, 42-xonadon',
    instructions: 'Domofon kodi 42#, yetib kelishdan 5 daqiqa oldin qo‘ng‘iroq qiling.',
    locationCoords: '41.3645, 69.2861',
    paymentMethod: 'card',
    items: [
      {
        productId: 'prod-101',
        name: 'Bayramona Toshkent Palovi (Double Go‘sht)',
        quantity: 2,
        unitPrice: 52000,
        lineTotal: 104000,
        customization: 'Standart porsiya (420g)'
      },
      {
        productId: 'prod-103',
        name: 'Muzdek Ayron Yalpizli (500ml)',
        quantity: 2,
        unitPrice: 14000,
        lineTotal: 28000,
        customization: '500 ml shisha idishda'
      }
    ],
    subtotal: 132000,
    deliveryFee: 15000,
    totalAmount: 147000,
    financeBreakdown: {
      subtotal: 132000,
      deliveryFee: 15000,
      totalAmount: 147000,
      paymentMethod: 'card',
      cashAmount: 0,
      cardAmount: 147000,
      onlineAmount: 0
    },
    status: 'Preparing food',
    estimatedDeliveryMinutes: 30,
    courier: null,
    timeline: [
      {
        status: 'Order received',
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        actor: 'Customer'
      },
      {
        status: 'Restaurant confirmed',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        actor: 'Oshxona Rayhon Milliy & Grill'
      },
      {
        status: 'Preparing food',
        timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
        actor: 'Oshxona Rayhon Milliy & Grill'
      }
    ]
  },
  {
    orderNumber: 'KF-739204',
    createdAt: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
    restaurantId: 'rest-2',
    restaurantName: 'Kayl Burger & Artisan Smash',
    restaurantAddress: 'Toshkent sh., Mirobod tumani, Taras Shevchenko ko‘chasi 24',
    customerName: 'Malika Karimova',
    customerPhone: '+998 93 321 65 43',
    deliveryAddress: 'Toshkent sh., Mirobod tumani, Nukus ko‘chasi 31-uy',
    instructions: '1-qavat ofis kirish qismi.',
    locationCoords: '41.2952, 69.2791',
    paymentMethod: 'online',
    items: [
      {
        productId: 'prod-201',
        name: 'Double Truffle Smash Burger',
        quantity: 1,
        unitPrice: 64000,
        lineTotal: 64000,
        customization: 'Standart Double'
      },
      {
        productId: 'prod-204',
        name: 'Berry Hibiscus Iced Craft Soda',
        quantity: 1,
        unitPrice: 22000,
        lineTotal: 22000,
        customization: '450 ml'
      }
    ],
    subtotal: 86000,
    deliveryFee: 12000,
    totalAmount: 98000,
    financeBreakdown: {
      subtotal: 86000,
      deliveryFee: 12000,
      totalAmount: 98000,
      paymentMethod: 'online',
      cashAmount: 0,
      cardAmount: 0,
      onlineAmount: 98000
    },
    status: 'On the way',
    estimatedDeliveryMinutes: 25,
    courier: {
      id: 'cour-1',
      firstName: 'Sardor',
      lastName: 'Tursunov',
      fatherName: 'Rustam o‘g‘li',
      fullName: 'Tursunov Sardor Rustam o‘g‘li',
      phone: '+998 90 123 45 67',
      vehicle: 'Skuter · 01 A 771 KA',
      assignmentState: 'on_the_way'
    },
    timeline: [
      {
        status: 'Order received',
        timestamp: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
        actor: 'Customer'
      },
      {
        status: 'Restaurant confirmed',
        timestamp: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
        actor: 'Kayl Burger & Artisan Smash'
      },
      {
        status: 'Preparing food',
        timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
        actor: 'Kayl Burger & Artisan Smash'
      },
      {
        status: 'Ready for pickup',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        actor: 'Kayl Burger & Artisan Smash'
      },
      {
        status: 'Courier assigned',
        timestamp: new Date(Date.now() - 1000 * 60 * 27).toISOString(),
        actor: 'Tursunov Sardor Rustam o‘g‘li'
      },
      {
        status: 'Courier picked up the order',
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        actor: 'Tursunov Sardor Rustam o‘g‘li'
      },
      {
        status: 'On the way',
        timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        actor: 'Tursunov Sardor Rustam o‘g‘li'
      }
    ]
  }
];

export const SEED_USERS = [
  {
    id: 'usr-cust-1',
    firstName: 'Azizbek',
    lastName: 'Rahimov',
    phone: '+998 90 998 11 22',
    passwordHash: 'demo:Kayl2026!',
    role: 'customer',
    savedAddresses: [
      {
        id: 'addr-1',
        label: 'Uy manzili',
        address: 'Toshkent sh., Yunusobod 4-dahasi, 18-uy, 42-xonadon',
        instructions: 'Domofon kodi 42#'
      },
      {
        id: 'addr-2',
        label: 'Ish joyi (IT Park)',
        address: 'Toshkent sh., Mirzo Ulug‘bek tumani, Mo‘minov ko‘chasi 4A',
        instructions: 'Sharqiy blok, 3-qavat'
      }
    ]
  },
  {
    id: 'usr-rest-1',
    firstName: 'Jamshid',
    lastName: 'Usmonov',
    phone: '+998 90 100 20 30',
    passwordHash: 'demo:Rest2026!',
    role: 'restaurant',
    restaurantId: 'rest-1',
    savedAddresses: []
  },
  {
    id: 'usr-cour-1',
    firstName: 'Sardor',
    lastName: 'Tursunov',
    fatherName: 'Rustam o‘g‘li',
    phone: '+998 90 123 45 67',
    passwordHash: 'demo:Cour2026!',
    role: 'courier',
    courierId: 'cour-1',
    savedAddresses: []
  },
  {
    id: 'usr-admin-1',
    firstName: 'Kamoliddin',
    lastName: 'Aliyev',
    phone: '+998 90 777 00 00',
    passwordHash: 'demo:Admin2026!',
    role: 'super_admin',
    savedAddresses: []
  }
];

export const SEED_SETTINGS = {
  platformName: 'KaylFood',
  supportPhone: '+998 71 200 00 07',
  supportEmail: 'support@kaylfood.uz',
  serviceCommissionPercent: 12,
  defaultCurrency: 'UZS',
  maintenanceMode: false,
  telegramChannelALabel: 'Channel A — Main Orders (-1003981429167)',
  telegramChannelBLabel: 'Channel B — Financial Reports (-1004296766840)',
  courierBotLabel: 'KaylFood Courier Bot'
};
