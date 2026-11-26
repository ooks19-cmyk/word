const CACHE_NAME = 'fc-star-v494';
const IMAGE_CACHE_NAME = 'fc-star-images-v1';
const ASSETS = [
  './index.html',
  './difficulty_config.json',
  './style.css',
  './css/global.css',
  './css/card.css',
  './css/pack.css',
  './css/market.css',
  './css/squad.css',
  './css/quiz.css',
  './css/match.css',
  './css/friend.css',
  './css/realtime.css',
  './js/state.js',
  './js/utils.js',
  './js/card.js',
  './js/pack.js',
  './js/market.js',
  './js/deck.js',
  './js/squad.js',
  './js/difficulty_config.js',
  './js/match_algorithm.js',
  './js/league.js',
  './js/cup.js',
  './js/acl.js',
  './js/friendly.js',
  './js/update_data.js',
  './js/auth.js',
  './js/friend.js',
  './js/realtime.js',
  './js/achievements.js',
  './js/national_data.js',
  './js/national_squad.js',
  './js/national.js',
  './js/national_hof.js',
  './js/coach_advisor.js',
  './app.js',
  './db.js',
  './sound.js',
  './quiz.js',
  './manifest.json',
  './player_data.js',
  './quiz_data.js',
  './other_teams_data.js',
  './other_teams_data_epl.js',
  './other_teams_data_jleague.js',
  './other_teams_data_ligue1.js',
  './img/mark_jb.svg',
  './img/mark_psg.png'
];

// Install Service Worker and cache essential assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching all essential game assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Service Worker and clean up old app caches (preserve permanent image cache)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== IMAGE_CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

function isImageRequest(url) {
  const path = decodeURIComponent(url.pathname).toLowerCase();
  return (
    path.startsWith('/player/') ||
    path.startsWith('/player2/') ||
    path.startsWith('/img/') ||
    path.includes('/player/') ||
    path.includes('/player2/') ||
    path.includes('/img/') ||
    /\.(webp|png|jpe?g|svg|gif|ico)$/.test(path)
  );
}

function isVersionedStaticAsset(url) {
  const path = url.pathname.toLowerCase();
  return url.searchParams.has('v') && /\.(js|css)$/.test(path);
}

async function cacheFirst(request, cacheName, allowIgnoreSearchFallback = false) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone()).catch(() => {});
    }
    return networkResponse;
  } catch (err) {
    const anyCached = await caches.match(request, allowIgnoreSearchFallback ? { ignoreSearch: true } : undefined);
    if (anyCached) return anyCached;
    throw err;
  }
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

// Fetch intercepted requests: Cache-First for images & versioned assets, Network-First for HTML/others
self.addEventListener('fetch', (e) => {
  // Only handle GET requests and local origin assets
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(e.request.url);

  if (isImageRequest(url)) {
    e.respondWith(cacheFirst(e.request, IMAGE_CACHE_NAME));
    return;
  }

  if (isVersionedStaticAsset(url)) {
    e.respondWith(cacheFirst(e.request, CACHE_NAME, true));
    return;
  }

  e.respondWith(networkFirst(e.request, CACHE_NAME));
});
