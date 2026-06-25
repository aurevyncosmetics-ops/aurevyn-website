// ==========================================
// AUREVYN - SERVICE WORKER FOR PUSH NOTIFICATIONS
// File: sw-notifications.js
// IMPORTANT: Place this file in the website's ROOT folder
// Example: aurevyn.makeup/sw-notifications.js
// ==========================================

const CACHE_NAME = 'aurevyn-sw-v3'; // bump this number whenever you change which files get cached, so old caches get cleared

// Files that are safe to cache the moment the service worker installs.
// Keep this list small — only files whose URL never changes (no ?v= query strings).
const PRECACHE_URLS = [
    '/',
    '/favicon.png',
    '/apple-touch-icon.png'
];

// Anything from these hosts should ALWAYS go to the network — never cache,
// because this is live order/review data and must never be shown stale or offline.
const NEVER_CACHE_HOSTS = ['firestore.googleapis.com', 'firebaseio.com', 'googleapis.com'];

let scheduledTimers = [];

// Clear all scheduled timers
function clearAllTimers() {
    scheduledTimers.forEach(t => clearTimeout(t));
    scheduledTimers = [];
}

// Show a notification
function showNotification(title, body, tag) {
    self.registration.showNotification(title, {
        body: body,
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: tag,
        renotify: true,
        requireInteraction: tag === 'order-reminder-3', // Last one stays until dismissed
        actions: [
            { action: 'confirm', title: '✅ Confirm Order' },
            { action: 'dismiss', title: '⏰ Cancel Order' }
        ],
        data: { url: self.location.origin + '/?remind=1' }
    });
}

// Message event - receive instructions from the main thread
self.addEventListener('message', function(event) {
    const { type, notifications } = event.data || {};

    if (type === 'SCHEDULE_NOTIFICATIONS') {
        clearAllTimers();

        if (!notifications || !notifications.length) return;

        notifications.forEach(function(notif) {
            const delay = notif.time - Date.now();
            if (delay <= 0) return; // Already passed

            const timerId = setTimeout(function() {
                showNotification(notif.title, notif.body, notif.tag);
            }, delay);

            scheduledTimers.push(timerId);
        });
    }

    if (type === 'CANCEL_NOTIFICATIONS') {
        clearAllTimers();
        // Close any visible notifications
        self.registration.getNotifications().then(function(notifs) {
            notifs.forEach(function(n) { n.close(); });
        });
    }
});

// Notification click event - customer tapped the notification
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    const action = event.action;
    const targetUrl = (event.notification.data && event.notification.data.url)
        ? event.notification.data.url
        : self.location.origin;

    // Both 'confirm' and 'dismiss' (Cancel Order) now open the website —
    // dismiss tells the page to actually cancel the order instead of doing nothing.
    const messageType = action === 'dismiss' ? 'OPEN_CANCEL_MODAL' : 'OPEN_CONFIRM_MODAL';
    const openUrl = action === 'dismiss'
        ? targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=cancel'
        : targetUrl;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // If a tab is already open, focus it
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.postMessage({ type: messageType });
                    return;
                }
            }
            // Open a new tab
            if (clients.openWindow) {
                return clients.openWindow(openUrl);
            }
        })
    );
});

// ==========================================
// OFFLINE CACHING (PWA support)
// ==========================================

// Install - precache the small set of files we know will always exist at these exact URLs
self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            // Add each file separately (not cache.addAll) so one missing file
            // doesn't fail the whole install
            return Promise.all(
                PRECACHE_URLS.map(function(url) {
                    return cache.add(url).catch(function() {
                        // ignore - file may not exist yet, runtime caching will pick it up later
                    });
                })
            );
        })
    );
});

// Activate - take control immediately and delete old version caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        Promise.all([
            clients.claim(),
            caches.keys().then(function(keys) {
                return Promise.all(
                    keys.filter(function(key) { return key !== CACHE_NAME; })
                        .map(function(key) { return caches.delete(key); })
                );
            })
        ])
    );
});

// Fetch - serve from cache when possible, keep cache updated, work offline
self.addEventListener('fetch', function(event) {
    const request = event.request;

    // Only handle simple GET requests over http/https.
    // POST requests (e.g. Firebase writes) and other schemes pass through untouched.
    if (request.method !== 'GET') return;
    if (!request.url.startsWith('http')) return;

    const url = new URL(request.url);

    // Live backend data (orders, reviews) must never be cached or served stale
    if (NEVER_CACHE_HOSTS.some(function(host) { return url.hostname.includes(host); })) {
        return;
    }

    const acceptHeader = request.headers.get('accept') || '';

    // HTML pages: try network first (so customers always see latest site when online),
    // fall back to cache, then to the cached homepage if totally offline
    if (request.mode === 'navigate' || acceptHeader.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(function(response) {
                    const responseCopy = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(request, responseCopy);
                    });
                    return response;
                })
                .catch(function() {
                    return caches.match(request).then(function(cached) {
                        return cached || caches.match('/');
                    });
                })
        );
        return;
    }

    // Everything else - CSS, JS, images (img/ folder), fonts, CDN scripts:
    // serve from cache instantly if we have it, and refresh the cache in the background.
    // If we don't have it cached yet, wait for the network and cache it for next time.
    event.respondWith(
        caches.match(request).then(function(cached) {
            const networkFetch = fetch(request)
                .then(function(response) {
                    // Cache successful same-origin responses AND opaque cross-origin
                    // responses (CDN fonts/scripts loaded without CORS still come back "opaque")
                    if (response && (response.ok || response.type === 'opaque')) {
                        const responseCopy = response.clone();
                        caches.open(CACHE_NAME).then(function(cache) {
                            cache.put(request, responseCopy);
                        });
                    }
                    return response;
                })
                .catch(function() {
                    // offline and not cached - nothing we can do for this request
                    return cached;
                });

            return cached || networkFetch;
        })
    );
});
