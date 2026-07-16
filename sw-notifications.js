// ==========================================
// AUREVYN - SERVICE WORKER FOR PUSH NOTIFICATIONS
// File: sw-notifications.js
// IMPORTANT: Place this file in the website's ROOT folder
// Example: aurevyn.makeup/sw-notifications.js
// ==========================================

const CACHE_NAME = 'aurevyn-sw-v5'; // bump this number whenever you change which files get cached, so old caches get cleared

// Files that are safe to cache the moment the service worker installs.
// Keep this list small — only files whose URL never changes (no ?v= query strings).
const PRECACHE_URLS = [
    '/',
    '/favicon-32x32.png',
    '/apple-touch-icon.png'
];

// Anything from these hosts should ALWAYS go to the network — never cache,
// because this is live order/review data and must never be shown stale or offline.
const NEVER_CACHE_HOSTS = ['firestore.googleapis.com', 'firebaseio.com', 'googleapis.com'];

let scheduledTimers = [];       // Order confirm/cancel reminders (existing feature)
let scheduledCartTimers = [];   // Abandoned cart reminders (new feature) — kept separate
                                 // so scheduling/cancelling one never touches the other.

// Clear all scheduled timers
function clearAllTimers() {
    scheduledTimers.forEach(t => clearTimeout(t));
    scheduledTimers = [];
}

function clearAllCartTimers() {
    scheduledCartTimers.forEach(t => clearTimeout(t));
    scheduledCartTimers = [];
}

// Show a notification. Accepts either the old (title, body, tag) call style
// (used by existing order-reminder code) or a single notif object with
// optional actions/data/requireInteraction (used by abandoned-cart reminders).
function showNotification(titleOrNotif, body, tag) {
    let notif;
    if (typeof titleOrNotif === 'object' && titleOrNotif !== null) {
        notif = titleOrNotif;
    } else {
        notif = { title: titleOrNotif, body: body, tag: tag };
    }

    self.registration.showNotification(notif.title, {
        body: notif.body,
        icon: notif.icon || '/favicon-32x32.png',
        badge: '/favicon-32x32.png',
        tag: notif.tag,
        renotify: true,
        requireInteraction: notif.requireInteraction !== undefined ? notif.requireInteraction : (notif.tag === 'order-reminder-3'),
        actions: notif.actions || [
            { action: 'confirm', title: '✅ Confirm Order' },
            { action: 'dismiss', title: '⏰ Cancel Order' }
        ],
        data: notif.data || { url: self.location.origin + '/?remind=1' }
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
                showNotification(notif);
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

    // Abandoned cart reminders — completely separate timer set/tag namespace
    // so they never cancel or get cancelled by the order-confirm reminders above.
    if (type === 'SCHEDULE_CART_NOTIFICATIONS') {
        clearAllCartTimers();

        if (!notifications || !notifications.length) return;

        notifications.forEach(function(notif) {
            const delay = notif.time - Date.now();
            if (delay <= 0) return;

            const timerId = setTimeout(function() {
                showNotification(notif);
            }, delay);

            scheduledCartTimers.push(timerId);
        });
    }

    if (type === 'CANCEL_CART_NOTIFICATIONS') {
        clearAllCartTimers();
        self.registration.getNotifications({ tag: 'cart-reminder-1' }).then(function(notifs) {
            notifs.forEach(function(n) { n.close(); });
        });
        self.registration.getNotifications({ tag: 'cart-reminder-2' }).then(function(notifs) {
            notifs.forEach(function(n) { n.close(); });
        });
    }
});

// Notification click event - customer tapped the notification
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    const action = event.action;
    const data = event.notification.data || {};
    const tag = event.notification.tag || '';
    const baseUrl = data.url || self.location.origin;

    // Abandoned-cart reminders: "WhatsApp" action opens WhatsApp directly (no need
    // to touch the site at all). Everything else opens/focuses the site and asks
    // the page to open the cart sidebar.
    if (tag.indexOf('cart-reminder') === 0) {
        if (action === 'whatsapp' && data.whatsappUrl) {
            event.waitUntil(clients.openWindow(data.whatsappUrl));
            return;
        }
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                        client.focus();
                        client.postMessage({ type: 'OPEN_CART' });
                        return;
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(baseUrl);
                }
            })
        );
        return;
    }

    // Order confirm/cancel reminders (existing behaviour, unchanged)
    // Both 'confirm' and 'dismiss' (Cancel Order) now open the website —
    // dismiss tells the page to actually cancel the order instead of doing nothing.
    const messageType = action === 'dismiss' ? 'OPEN_CANCEL_MODAL' : 'OPEN_CONFIRM_MODAL';
    const openUrl = action === 'dismiss'
        ? baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'action=cancel'
        : baseUrl;

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
