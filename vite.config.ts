import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    appType: 'mpa' as const,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.')
      }
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          login: path.resolve(__dirname, 'login.html'),
          register: path.resolve(__dirname, 'register.html'),
          restaurant: path.resolve(__dirname, 'restaurant.html'),
          checkout: path.resolve(__dirname, 'checkout.html'),
          tracking: path.resolve(__dirname, 'tracking.html'),
          profile: path.resolve(__dirname, 'customer/profile.html'),
          restaurantDashboard: path.resolve(__dirname, 'restaurant-dashboard/index.html'),
          courierDashboard: path.resolve(__dirname, 'courier-dashboard/index.html'),
          adminDashboard: path.resolve(__dirname, 'admin/index.html')
        }
      }
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {}
    }
  };
});
