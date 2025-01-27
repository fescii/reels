// import apps
import AppPost from "./post.js";
import AppProfile from "./profile.js";
import AppSearch from "./search.js";
import AppTopic from "./topic.js";
import AppUser from "./user.js";
import AppOffline from "./offline.js";
import AppUpdates from "./updates.js";
import AppThemes from "./themes.js";
import AppSoon from "./soon.js";


export default function apps() {
  // Register apps
  customElements.define("app-post", AppPost);
  customElements.define("app-profile", AppProfile);
  customElements.define("app-search", AppSearch);
  customElements.define("app-topic", AppTopic);
  customElements.define("app-user", AppUser);
  customElements.define("app-offline", AppOffline);
  customElements.define("app-updates", AppUpdates);
  customElements.define("app-themes", AppThemes);
  customElements.define("app-soon", AppSoon);
}