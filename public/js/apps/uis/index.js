import apps from "./apps/index.js";
import containers from "./containers/index.js";
import create from "./create/index.js";
import elements from "./elements/index.js";
import feeds from "./feeds/index.js";
import forms from "./forms/index.js";
import loaders from "./loaders/index.js";
import popups from "./popups/index.js";
import posts from "./post/index.js";
import sections from "./sections/index.js";
import stats from "./stats/index.js";
import wrappers from "./wrappers/index.js";
import AppManager from "./core/manager.js"
import NotificationManager from "./core/notify.js"
import WebSocketManager from "./core/uWs.js"

export default function uis() {
  apps()
  containers()
  create()
  elements()
  feeds()
  forms()
  loaders()
  popups()
  posts()
  sections()
  stats()
  wrappers()

  // core
  // core();
}


const core = () => {
  // get host name
  const host = window.location.hostname;

  window.wss = new WebSocketManager(`${host}`);
  window.wss.connect();

  // Start NotificationManager
  // Create a global instance
  window.notify = new NotificationManager();


  // add event listener document loaded
  document.addEventListener("DOMContentLoaded", () => {
    // create app manager
    const appManager = new AppManager();
    appManager.start();
  });

  window.matchMedia('(display-mode: standalone)').addEventListener('change', (evt) => {
    let displayMode = 'browser';
    if (evt.matches) {
      displayMode = 'standalone';
    }
    // Log display mode change to analytics
    console.log('DISPLAY_MODE_CHANGED', displayMode);
  });
}