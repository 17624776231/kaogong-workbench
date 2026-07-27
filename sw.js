// Service Worker - 考公工作台 PWA
const CACHE_NAME = 'kaogong-v2';
const CACHE_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// 安装 - 缓存核心文件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

// 激活 - 清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 请求 - 网络优先，离线时回退缓存
self.addEventListener('fetch', event => {
  // 词语查询 API 不缓存（实时数据）
  if (event.request.url.includes('apihz.cn')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(
        JSON.stringify({ code: 400, msg: '离线状态无法查词' }),
        { headers: { 'Content-Type': 'application/json' } }
      ))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then(response => {
      // 成功则更新缓存
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      return response;
    }).catch(() => caches.match(event.request))
  );
});