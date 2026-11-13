# KaylFood — Zamonaviy Ovqat Yetkazib Berish Marketpleysi va Telegram Bot Integratsiyasi Qo‘llanmasi

**KaylFood** — HTML5, CSS3, Vanilla JavaScript (ES6+) hamda Netlify Serverless Functions asosida qurilgan, Apple Liquid Glass dizayn uslubidagi to‘liq funksional ovqat yetkazib berish platformasi.

Ushbu qo‘llanmada loyiha arxitekturasi, rasmlarni joylashtirish tartibi hamda **2 ta Telegram kanal** va **2 ta alohida Telegram bot**ni xavfsiz sozlash bo‘yicha bosqichma-bosqich yo‘riqnoma keltirilgan.

---

## 1. @BotFather orqali Asosiy Telegram Botni (Main Bot) yaratish

Asosiy bot mijozlar buyurtma berganida **Kanal A (Asosiy buyurtmalar)** va **Kanal B (Moliyaviy hisobotlar)** kanallariga avtomatik xabarnoma yuborish uchun xizmat qiladi.

1. Telegram ilovasida **[@BotFather](https://t.me/BotFather)** rasmiy botini oching va `/start` buyrug‘ini bosing.
2. Yangi bot yaratish uchun `/newbot` buyrug‘ini yuboring.
3. Botning ko‘rinadigan nomini kiriting (masalan: `KaylFood Buyurtmalar Boti`).
4. Bot uchun `_bot` bilan tugaydigan unikal username kiriting (masalan: `kaylfood_main_bot`).
5. @BotFather sizga HTTP API token taqdim etadi. Bu qiymat `TELEGRAM_MAIN_BOT_TOKEN` o‘zgaruvchisiga yoziladi.

---

## 2. Alohida Kuryer Botini (Courier Bot) yaratish

Kuryerlar buyurtmalarni qabul qilishi (`Accept`), rad etishi (`Reject`) va yetkazib berish holatlarini (`Picked up`, `On the way`, `Delivered`) inline tugmalar orqali boshqarishi uchun ikkinchi, mustaqil bot yaratiladi:

1. Yana **[@BotFather](https://t.me/BotFather)** ga `/newbot` buyrug‘ini yuboring.
2. Bot nomini kiriting (masalan: `KaylFood Kuryer Boti`).
3. Bot uchun username kiriting (masalan: `kaylfood_courier_bot`).
4. Ushbu username `TELEGRAM_COURIER_BOT_USERNAME` o‘zgaruvchisiga (`@` belgisisiz) yoziladi.
5. Olingan ikkinchi API token esa `TELEGRAM_COURIER_BOT_TOKEN` o‘zgaruvchisiga joylanadi.

---

## 3. Bot API Tokenlarini olish va xavfsizlik qoidalari

- Har ikki bot tokenini @BotFather xabaridan yoki `/mybots` → Botni tanlash → **API Token** bo‘limidan olishingiz mumkin.
- **QAT’IY XAVFSIZLIK QOIDASI**: Bot tokenlarini hech qachon `index.html`, CSS fayllari yoki brauzerda ochiladigan `js/*.js` fayllariga yozmang! Barcha tokenlar faqat server tomonida (`netlify/functions/*`) `process.env` orqali o‘qiladi.

---

## 4. Asosiy Botni "Kanal A — Asosiy Buyurtmalar" kanaliga Administrator qilish

1. Telegramda yangi yopiq (Private) yoki ochiq kanal yarating (masalan: **KaylFood — Buyurtmalar**).
2. Kanal sozlamalariga kiring → **Administrators (Administratorlar)** → **Add Admin (Administrator qo‘shish)**.
3. Qidiruv satriga 1-qadamda yaratgan **Asosiy botingiz** (`TELEGRAM_MAIN_BOT_TOKEN` egasi) username’ini yozing va tanlang.
4. Botga **"Post Messages" (Xabarlar joylashtirish)** huquqini yoqing va tasdiqlang.

---

## 5. Asosiy Botni "Kanal B — Moliyaviy Hisobotlar" kanaliga Administrator qilish

1. Telegramda ikkinchi alohida kanal yarating (masalan: **KaylFood — Moliya va Hisobot**).
2. Kanal sozlamalari → **Administrators** → **Add Admin** bo‘limiga kiring.
3. Aynan o‘sha **Asosiy botni** ushbu ikkinchi kanalga ham administrator sifatida qo‘shing va **"Post Messages"** ruxsatini bering.

---

## 6. Har bir Telegram Kanal ID (`CHANNEL_ID`) raqamini aniqlash

Telegramdagi superguruh va kanallar ID raqami odatda `-100` bilan boshlanadi (masalan: `-1003981429167`). Uni aniqlashning 2 ta oson usuli:

- **1-usul**: Kanalingizda birorta test xabar yozing va uni **[@userinfobot](https://t.me/userinfobot)** yoki **[@getmyid_bot](https://t.me/getmyid_bot)** ga "Forward" (uzatish) qiling. Bot sizga `Forwarded from chat: -100...` ko‘rinishida kanalning aniq ID raqamini qaytaradi.
- **2-usul**: Asosiy bot kanalga admin qilingach, kanalga test xabar yozib, brauzerda quyidagi manzilni oching:
  `https://api.telegram.org/bot<TELEGRAM_MAIN_BOT_TOKEN>/getUpdates`
  Qaytgan JSON ichidagi `"chat":{"id":-100...}` qiymati kanal ID hisoblanadi.

---

## 7. Lokal `.env` faylini sozlash

Loyiha ildizida `.env.example` faylidan nusxa olib `.env` nomli fayl yarating (`.env` fayli `.gitignore` ga kiritilgan va GitHubga yuklanmaydi):

```env
TELEGRAM_MAIN_BOT_TOKEN=8854624044:AAEDn_-gq0IqAgIow27-lzqTRR9q5g3oE1s
TELEGRAM_COURIER_BOT_TOKEN=8960586822:AAHu3U_IGqGLU_n6mxLxHvwmXy_dwTXWYvM

TELEGRAM_ORDERS_CHANNEL_ID=-1003981429167
TELEGRAM_FINANCE_CHANNEL_ID=-1004296766840

TELEGRAM_COURIER_BOT_USERNAME=PUT_COURIER_BOT_USERNAME_HERE
```

### O‘zgaruvchilar izohi:
| O‘zgaruvchi nomi | Qanday qiymat yoziladi |
| :--- | :--- |
| `TELEGRAM_MAIN_BOT_TOKEN` | Asosiy buyurtma va moliya kanallariga xabar yuboruvchi botning @BotFather tokeni |
| `TELEGRAM_COURIER_BOT_TOKEN` | Kuryerlar bilan ishlovchi alohida botning @BotFather tokeni |
| `TELEGRAM_ORDERS_CHANNEL_ID` | **Kanal A** (Asosiy buyurtmalar) ID raqami (`-100...` formatida) |
| `TELEGRAM_FINANCE_CHANNEL_ID` | **Kanal B** (Moliyaviy hisobotlar) ID raqami (`-100...` formatida) |
| `TELEGRAM_COURIER_BOT_USERNAME` | Kuryer botining username’i (masalan: `kaylfood_courier_bot`) |

---

## 8–9. Netlify platformasida Environment Variables sozlash

Loyihani Netlify’ga joylaganingizda maxfiy kalitlarni quyidagi tartibda kiriting:

1. [Netlify Dashboard](https://app.netlify.com/) ga kiring va **KaylFood** saytingizni tanlang.
2. Chap menyudan **Site configuration** → **Environment variables** bo‘limiga o‘ting.
3. **Add a variable** → **Add a single variable** (yoki **Import from a .env file**) tugmasini bosing.
4. Yuqoridagi 5 ta o‘zgaruvchini (`TELEGRAM_MAIN_BOT_TOKEN`, `TELEGRAM_COURIER_BOT_TOKEN`, `TELEGRAM_ORDERS_CHANNEL_ID`, `TELEGRAM_FINANCE_CHANNEL_ID`, `TELEGRAM_COURIER_BOT_USERNAME`) aynan bir xil nom bilan kiriting va **Save** tugmasini bosing.

---

## 10. Loyihani Deploy qilish (Ishga tushirish)

- **Netlify orqali**: GitHub repozitoriyangizni Netlify’ga ulang. `netlify.toml` fayli avtomatik ravishda `publish = "."` va `functions = "netlify/functions"` sozlamalarini o‘qiydi. Environment variables kiritilgach, **Deploys → Trigger deploy → Deploy site** tugmasini bosing.
- **Lokal muhitda**:
  ```bash
  npm install
  npm run dev
  ```

---

## 11. Kuryer Boti Webhook (`telegram-webhook.js`) manzilini ulash

Kuryer Telegram botidagi inline tugmalarni (`Accept`, `Reject`, `Picked up`, `On the way`, `Delivered`) bosganida serverga real vaqtda xabar kelishi uchun Webhook o‘rnatiladi. Saytingiz deploy bo‘lgach, quyidagi URL manzilni bir marta brauzerda yoki `curl` orqali chaqiring:

```text
https://api.telegram.org/bot<TELEGRAM_COURIER_BOT_TOKEN>/setWebhook?url=https://<SIZNING-SAYT-DOMENINGIZ>/.netlify/functions/telegram-webhook
```

Javob sifatida `{"ok":true,"result":true,"description":"Webhook was set"}` xabari chiqadi.

---

## 12. Kanal A va Kanal B xabarnomalarini tekshirish

1. **Mijoz oqimi orqali**: Bosh sahifadan biror restoranni ochib, taomlarni savatchaga qo‘shing va `checkout.html` sahifasida buyurtmani tasdiqlang. Serverdagi `create-order.js` funksiyasi bir vaqtning o‘zida:
   - **Kanal A** ga to‘liq buyurtma tafsilotlarini;
   - **Kanal B** ga haqiqiy hisoblangan Naqd / Karta / Onlayn moliyaviy hisobotni yuboradi.
2. **Super Admin orqali**: `admin/index.html` sahifasining yuqori o‘ng burchagidagi **"Kanal A test"** va **"Kanal B (Moliya) test"** tugmalarini bosib, yuborilgan xabar matni va API natijasini darhol ko‘rishingiz mumkin.

---

## 13. Kuryer biriktirish va yetkazib berish holatlarini tekshirish

1. `restaurant-dashboard/index.html` (Restoran egasi paneli) sahifasini oching.
2. Buyurtmalar jadvalidagi biror buyurtma qatoridan kuryerni tanlang va **"Yuborish"** tugmasini bosing.
3. Serverdagi `assign-courier.js` funksiyasi kuryerga Telegram inline tugmali so‘rov jo‘natadi va buyurtma holatini `Courier assigned` ga o‘zgartiradi.
4. `courier-dashboard/index.html` (Kuryer paneli) sahifasiga o‘tib yoki Telegram bot ichidan **"Qabul qilish (Accept)"** → **"Olib ketildi (Picked up)"** → **"Yo‘lda (On the way)"** → **"Yetkazib berildi (Delivered)"** tugmalarini bosing.
5. `tracking.html` (Buyurtma kuzatuvi) sahifasida kuryerning to‘liq F.I.Sh. (Familiya, Ism, Otasining ismi), telefon raqami va 9 bosqichli timeline real vaqtda yangilanganini ko‘rasiz.

---

## 14. Rasmlarni qo‘lda joylashtirish (Image Placeholders)

Barcha rasm konteynerlari tayyor o‘lcham va Liquid Glass uslubida yaratilgan. Rasmlarni qo‘shish uchun HTML va JS fayllaridagi quyidagi izohlarni topib, ichiga `<img src="assets/images/..." alt="..." />` teglarini qo‘yishingiz kifoya:

- `<!-- ADD HERO IMAGE HERE -->`
- `<!-- ADD RESTAURANT IMAGE HERE -->`
- `<!-- ADD RESTAURANT LOGO HERE -->`
- `<!-- ADD FOOD PRODUCT IMAGE HERE -->`
