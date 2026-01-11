const CACHE_NAME = 'rephrase-v1.0.2-android-speed-uncapped';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/styles/main.css',
  '/responsive.css',
  '/training/',
  '/training/index.html',
  '/training/js/auth.js',
  '/training/js/security.js',
  '/training/js/voice_system.js',
  '/training/matrix/',
  '/training/grammar/',
  '/manifest.json'
];

// インストール時のキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 キャッシュを開始');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('❌ キャッシュエラー:', error);
      })
  );
});

// フェッチ時のキャッシュ戦略（Network First）
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // レスポンスが成功した場合、キャッシュに保存
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // ネットワークが失敗した場合、キャッシュから返す
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // キャッシュにもない場合、404ページを返す
            if (event.request.mode === 'navigate') {
              return caches.match('/404.html');
            }
            throw new Error('Network failed and no cache available');
          });
      })
  );
});

// アクティベート時の古いキャッシュ削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
