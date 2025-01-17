const PUBLIC_VAPID_KEY = 'BIkpXBrEUnbZW527GQKacT2wMXZQZIb6ASMxE3xL4NZ9U3Ey2-vEjaY-grU61o8sN_PE3TuBgup8k-m2qMTgXdQ';

export default class AppManager {
  constructor() {
    this.host = window.location.hostname;
    this.user = window.hash;
    this.swRegistration = null;
    this.isSubscribed = false;
    this.applicationServerKey = this.urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
    this.urls = [
      '/api/v1/h/recent',
      '/api/v1/h/trending',
      '/api/v1/q/trending/topics',
      '/api/v1/q/trending/people'
    ]
  }

  init() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      this.registerServiceWorker()
        .then(() => this.subscribeUserToPush())
        .catch((error) => console.error('Error during initialization:', error));
    } else {
      console.warn('Push messaging is not supported');
    }
  }

  registerServiceWorker() {
    return navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration);
        this.swRegistration = registration;

        // register periodic background sync & background sync
        this.registerBackgroundSync(registration);
        this.registerPeriodicSync(registration);

        // add subscription to the window object
        window.swRegistration = registration;

        this.fetchAndCacheData();
        return registration;
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
        throw error;
      });
  }

  subscribeUserToPush() {
    // if not user is logged in, don't subscribe
    if (!this.user) return Promise.resolve();

    return this.swRegistration.pushManager.getSubscription()
      .then(async (subscription) => {
        this.isSubscribed = !(subscription === null);
        if (this.isSubscribed) {
          await this.sendSubscriptionToServer(subscription)
          console.log('User is already subscribed')
          return subscription;
        } else {
          return this.swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.applicationServerKey,
          });
        }
      }).then(async (subscription) => await this.sendSubscriptionToServer(subscription));
  }

  registerBackgroundSync = async registration => {
    try {
      // Check if sync registration already exists
      const syncTags = await registration.sync.getTags();
      if (!syncTags.includes('update-notifications')) {
        await registration.sync.register('update-notifications');
        console.log('Background sync registered!');
      } else {
        console.log('Background sync already registered.');
      }
    } catch (error) {
      console.warn("Background Sync could not be registered:");
    }
  }

  registerPeriodicSync = async registration => {
    try {
      // Check if periodic background sync is allowed
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync'
      });
  
      if (status.state === 'granted' && 'periodicSync' in registration) {
        const periodicTags = await registration.periodicSync.getTags();
        if (!periodicTags.includes('fetch-updates')) {
          await registration.periodicSync.register("fetch-updates", {
            minInterval: 24 * 60 * 60 * 1000, // Minimum interval of 1 day
          });
          console.log('Periodic sync registered!');
        } else {
          console.log('Periodic sync already registered.');
        }
      } else {
        console.error('Periodic Background Sync permission denied.');
      }
    } catch (error) {
      console.warn("Periodic Sync could not be registered:");
    }
  }

  sendSubscriptionToServer =  async subscription => {
    try {
      const response = await fetch(`/api/v1/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      const result = await response.json();
      console.log('Subscription sent to server:', result);
    }
    catch(error){
      console.warn('Error sending push notification subscription to server')
    };
  }

  urlBase64ToUint8Array(base64String) {
    const cleanedBase64 = base64String.replace(/[^A-Za-z0-9\-_]/g, '');
    const padding = '='.repeat((4 - (cleanedBase64.length % 4)) % 4);
    const base64 = (cleanedBase64 + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    try {
      const rawData = atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    } catch (error) {
      console.error('Error in urlBase64ToUint8Array:', error);
      throw new Error('Invalid base64 string');
    }
  }

  // Fetch data from network and cache it for offline use: urls are defined in the constructor
  fetchAndCacheData = async () => {
    const maxAge = 60 * 1000; // 1 minute
    const fetchOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Max-Age': maxAge,
      },
    };

    try {
      await Promise.all(this.urls.map(url => this.getCacheData(url, maxAge, fetchOptions)));
      
      // log success
      console.log('Data fetched and cached successfully');
    }
    catch (error) {
      console.error('Error fetching and caching data:', error);
      // retry after 5 seconds
      setTimeout(this.fetchAndCacheData, 5000);
    }
  }

  getCacheData = async (url, maxAge, options = {}) => {
    const cacheName = "user-cache";
  
    try {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(url);
  
      if (cachedResponse) {
        const cachedData = await cachedResponse.json();
        const cacheTime = cachedData.timestamp;
  
        // Check if cache is still valid
        if (Date.now() - cacheTime < maxAge) {
          return { cachedData: true, networkResponse: false };
        }
      }
  
      // If cache doesn't exist or is expired, fetch new data
      const networkResponse = await fetch(url, options);
      const data = await networkResponse.clone().json();
  
      // Store the new data in cache with a timestamp
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      
      const cacheResponse = new Response(JSON.stringify(cacheData));
      await cache.put(url, cacheResponse);
  
      return { cachedData: false, networkResponse: true };
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };

  // Make the AppManager self-initiating
  start() {
    this.init();
  }
}