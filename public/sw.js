const CACHE_NAME = 'good-lak-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon.png',
  '/logo.png',
  '/apple-touch-icon.png'
];

// Установка service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Активация service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  // Пропускаем POST запросы и API запросы
  if (event.request.method !== 'GET') {
    return;
  }

  // Пропускаем запросы к API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Возвращаем кэшированный ответ если есть
        if (response) {
          return response;
        }

        // Иначе делаем запрос к сети
        return fetch(event.request).then((response) => {
          // Проверяем что ответ валидный
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Клонируем ответ для кэша
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Если нет сети и нет кэша, возвращаем главную страницу
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});
