/**
 * KaylFood — Authentication, Registration, Role Management & Customer Profile
 * Clearly separates Demo Mode localStorage auth from Production backend auth.
 */
import { StorageService } from './storage.js';
import { isValidUzbekPhone, showToast, getBasePath } from './utils.js';
import { NotificationCenter } from './notifications.js';

export const AuthService = {
  getCurrentUser() {
    return StorageService.getCurrentUser();
  },

  registerCustomer({ firstName, lastName, phone, password, confirmPassword }) {
    const cleanFirst = String(firstName || '').trim();
    const cleanLast = String(lastName || '').trim();
    const cleanPhone = String(phone || '').trim();

    if (cleanFirst.length < 2) {
      return { ok: false, error: 'Ism kamida 2 ta belgidan iborat bo‘lishi kerak.' };
    }
    if (cleanLast.length < 2) {
      return { ok: false, error: 'Familiya kamida 2 ta belgidan iborat bo‘lishi kerak.' };
    }
    if (!isValidUzbekPhone(cleanPhone)) {
      return { ok: false, error: 'To‘g‘ri telefon raqam kiriting (masalan: +998 90 123 45 67).' };
    }
    if (!password || String(password).length < 6) {
      return { ok: false, error: 'Parol kamida 6 ta belgidan iborat bo‘lishi shart.' };
    }
    if (password !== confirmPassword) {
      return { ok: false, error: 'Parol va parol tasdig‘i bir-biriga mos kelmadi.' };
    }

    const users = StorageService.getUsers();
    const normalizedPhone = cleanPhone.replace(/\s+/g, '');
    const exists = users.find((u) => u.phone.replace(/\s+/g, '') === normalizedPhone);
    if (exists) {
      return { ok: false, error: 'Ushbu telefon raqam orqali avval ro‘yxatdan o‘tilgan.' };
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      firstName: cleanFirst,
      lastName: cleanLast,
      phone: cleanPhone,
      passwordHash: `demo:${password}`,
      role: 'customer',
      savedAddresses: [
        {
          id: `addr-${Date.now()}`,
          label: 'Asosiy manzil',
          address: 'Toshkent sh., Yunusobod tumani',
          instructions: ''
        }
      ]
    };

    users.push(newUser);
    StorageService.saveUsers(users);
    StorageService.setCurrentUser(newUser);

    NotificationCenter.push({
      type: 'account',
      title: 'KaylFood tizimiga xush kelibsiz!',
      message: `${cleanFirst} ${cleanLast}, profilingiz muvaffaqiyatli yaratildi.`
    });

    return { ok: true, user: newUser };
  },

  login({ phone, password }) {
    const cleanPhone = String(phone || '').trim();
    if (!isValidUzbekPhone(cleanPhone)) {
      return { ok: false, error: 'Telefon raqam formati noto‘g‘ri.' };
    }
    if (!password || String(password).length < 4) {
      return { ok: false, error: 'Parolni kiriting.' };
    }

    const users = StorageService.getUsers();
    const normalizedPhone = cleanPhone.replace(/\s+/g, '');
    const matched = users.find((u) => u.phone.replace(/\s+/g, '') === normalizedPhone);

    if (!matched) {
      return { ok: false, error: 'Bunday telefon raqamli foydalanuvchi topilmadi.' };
    }

    if (matched.passwordHash !== `demo:${password}`) {
      return { ok: false, error: 'Kiritilgan parol noto‘g‘ri.' };
    }

    StorageService.setCurrentUser(matched);
    return { ok: true, user: matched };
  },

  quickDemoSwitchRole(role) {
    const users = StorageService.getUsers();
    const target = users.find((u) => u.role === role) || users[0];
    StorageService.setCurrentUser(target);
    return target;
  },

  logout() {
    StorageService.setCurrentUser(null);
    const base = getBasePath();
    window.location.href = `${base}/login.html`;
  },

  updateProfile({ firstName, lastName, phone }) {
    const user = this.getCurrentUser();
    if (!user) return { ok: false, error: 'Tizimga kirmagansiz.' };

    const cleanFirst = String(firstName || '').trim();
    const cleanLast = String(lastName || '').trim();
    const cleanPhone = String(phone || '').trim();

    if (cleanFirst.length < 2 || cleanLast.length < 2) {
      return { ok: false, error: 'Ism va familiya to‘liq kiritilishi shart.' };
    }
    if (!isValidUzbekPhone(cleanPhone)) {
      return { ok: false, error: 'Telefon raqam formati noto‘g‘ri.' };
    }

    user.firstName = cleanFirst;
    user.lastName = cleanLast;
    user.phone = cleanPhone;

    const users = StorageService.getUsers().map((u) => (u.id === user.id ? user : u));
    StorageService.saveUsers(users);
    StorageService.setCurrentUser(user);
    return { ok: true, user };
  },

  addSavedAddress({ label, address, instructions }) {
    const user = this.getCurrentUser();
    if (!user) return { ok: false, error: 'Tizimga kiring.' };
    if (!address || String(address).trim().length < 5) {
      return { ok: false, error: 'Manzilni to‘liq kiriting (kamida 5 ta belgi).' };
    }

    user.savedAddresses = Array.isArray(user.savedAddresses) ? user.savedAddresses : [];
    user.savedAddresses.push({
      id: `addr-${Date.now()}`,
      label: String(label || 'Qo‘shimcha manzil').trim(),
      address: String(address).trim(),
      instructions: String(instructions || '').trim()
    });

    const users = StorageService.getUsers().map((u) => (u.id === user.id ? user : u));
    StorageService.saveUsers(users);
    StorageService.setCurrentUser(user);
    return { ok: true, user };
  },

  deleteSavedAddress(addressId) {
    const user = this.getCurrentUser();
    if (!user) return;
    user.savedAddresses = (user.savedAddresses || []).filter((a) => a.id !== addressId);
    const users = StorageService.getUsers().map((u) => (u.id === user.id ? user : u));
    StorageService.saveUsers(users);
    StorageService.setCurrentUser(user);
  }
};

export function wirePasswordToggles() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-toggle-password');
      const input = document.getElementById(targetId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = 'Yashirish';
      } else {
        input.type = 'password';
        btn.textContent = 'Ko‘rsatish';
      }
    });
  });
}

export function initLoginPage() {
  wirePasswordToggles();
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (errorBox) errorBox.textContent = '';

      const phone = document.getElementById('login-phone')?.value || '';
      const password = document.getElementById('login-password')?.value || '';
      const res = AuthService.login({ phone, password });

      if (!res.ok) {
        if (errorBox) errorBox.textContent = res.error;
        showToast(res.error, 'error');
        return;
      }

      showToast(`Xush kelibsiz, ${res.user.firstName}!`, 'success');
      const base = getBasePath();
      window.location.href = `${base}/index.html`;
    });
  }

  document.querySelectorAll('[data-demo-login]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-demo-login');
      const user = AuthService.quickDemoSwitchRole(role);
      showToast(`${user.firstName} (${role}) sifatida tizimga kirildi`, 'success');
      const base = getBasePath();
      if (role === 'restaurant') {
        window.location.href = `${base}/restaurant-dashboard/index.html`;
      } else if (role === 'courier') {
        window.location.href = `${base}/courier-dashboard/index.html`;
      } else if (role === 'super_admin') {
        window.location.href = `${base}/admin/index.html`;
      } else {
        window.location.href = `${base}/index.html`;
      }
    });
  });
}

export function initRegisterPage() {
  wirePasswordToggles();
  const form = document.getElementById('register-form');
  const errorBox = document.getElementById('register-error');

  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (errorBox) errorBox.textContent = '';

    const firstName = document.getElementById('reg-first-name')?.value || '';
    const lastName = document.getElementById('reg-last-name')?.value || '';
    const phone = document.getElementById('reg-phone')?.value || '';
    const password = document.getElementById('reg-password')?.value || '';
    const confirmPassword = document.getElementById('reg-confirm-password')?.value || '';

    const res = AuthService.registerCustomer({
      firstName,
      lastName,
      phone,
      password,
      confirmPassword
    });

    if (!res.ok) {
      if (errorBox) errorBox.textContent = res.error;
      showToast(res.error, 'error');
      return;
    }

    showToast('Ro‘yxatdan o‘tish muvaffaqiyatli yakunlandi!', 'success');
    const base = getBasePath();
    window.location.href = `${base}/customer/profile.html`;
  });
}
