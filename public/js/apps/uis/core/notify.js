export default class NotificationManager {
  constructor() {
    this.isSupported = "Notification" in window;
    this.permission = this.checkPermission();
  }

  checkPermission() {
    if (!this.isSupported) {
      console.warn("This browser does not support desktop notifications");
      return false;
    }
    return Notification.permission === "granted";
  }

  async requestPermission() {
    if (!this.isSupported) {
      console.warn("Notifications not supported");
      return false;
    }
    const permission = await Notification.requestPermission();
    this.permission = permission === "granted";
    console.log(this.permission ? "Notification permission granted" : "Notification permission denied");
    return this.permission;
  }

  async notify(title, options = {}) {
    if (!this.permission) {
      console.log("Notification permission not granted. Requesting permission...");
      if (!(await this.requestPermission())) {
        console.warn("Failed to get notification permission");
        return null;
      }
    }

    const notification = new Notification(title, options);
    if (options.link) {
      notification.onclick = () => {
        window.open(options.link, '_blank');
      };
    }
    return notification;
  }

  removeNotification(notification) {
    if (notification && typeof notification.close === 'function') {
      notification.close();
    }
  }

  removeAllNotifications() {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.getNotifications().then(notifications => {
          notifications.forEach(notification => notification.close());
        });
      });
    }
  }
}