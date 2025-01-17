const CACHE_NAME = 'v0.2.8';
const urlsToCache = [
  '/',
  '/static/css/style.css',
  '/static/css/theme.css',
  '/static/css/res.css',
  '/offline',
  // '/static/js/dist/bundle.0.2.8.js',
  '/static/img/favi.png',
  '/static/js/index.js',
];

const RETRY_INTERVAL = 5000; // 5 seconds
const MAX_RETRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

let socket;
let retryCount = 0;
let retryStartTime;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip requests with unsupported schemes
  if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') {
    return;
  }

  const isStaticAsset = /\.(html|css|js|map|json|xml|ico|txt|webmanifest|woff2|ttf|eot|otf)$/i.test(requestUrl.pathname);
  const isImage = /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(requestUrl.pathname);

  if (isStaticAsset) {
    // Handle static assets (cache them)
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then(async (networkResponse) => {
          try { 
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          } catch (error) {
            console.error('Failed to cache static asset:', error);
            return networkResponse;
          }
        });
      })
    );
  } else if (isImage) {
    // Let browser manage image caching based on S3 Cache-Control headers
    event.respondWith(fetch(event.request));
  } else {
    // For other requests (like API or when offline), check for network or offline fallback
    event.respondWith(
      fetch(event.request)
        .catch(async () => {
          // Serve the offline page if network fails and request is not a navigational request
          const offlineResponse = await caches.match('/offline');
          if (offlineResponse) {
            return offlineResponse;
          }
          return caches.match('/home');
        })
    );
  }
});


self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});

self.addEventListener('push', event => {
  const data = event.data.json();
  // console.log('Push event received:', data);
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: { url: data.url }
  };

  // show notification
  event.waitUntil(self.registration.showNotification(data.title, options));

  // send receipt to the server
  sendReceipt(data.id)
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'update-notifications') {
    event.waitUntil(fetchUpdates());
  }
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "fetch-updates") {
    event.waitUntil(fetchUpdates());
  }
});

async function fetchUpdates() {
  try {
    const response = await fetch('/api/v1/push/updates');
    const data = await response.json();

    if (data.success) {
      const options = {
        body: data.text,
        icon: '/static/img/favi.png',
        badge: '/static/img/favi.png',
        data: { url: '/user/updates' }
      };

      const title = `${data.name}, check out the new updates.`
    
      if(data.updates > 0) {
        // show notification
        self.registration.showNotification(title, options)
      } else {
        console.log('No updates available.')
      }
    } else {
      console.error(data.message)
    }
  } catch (error) {
    console.error('Fetch failed:', error);
  }
}

const sendReceipt = async id => {
  try {
    const response = await fetch(`/api/v1/push/receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: id }),
    });

    const result = await response.json();
    console.log('Receipt send to the server:', result);
  }
  catch(error){
    console.error('Error sending receipt to server:', error)
  };
}

// Handle notification click event
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Close the notification

  // Open the URL specified in the notification data
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      // Check if the client is already open
      const client = clientList.find(c => c.url === event.notification.data.url && 'focus' in c);
      if (client) {
        return client.focus(); // Focus the existing client
      } else {
        return clients.openWindow(event.notification.data.url); // Open a new window
      }
    })
  );
});