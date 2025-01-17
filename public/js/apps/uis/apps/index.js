// import apps
import AppHome from "./home.js";
import AppPost from "./post.js";
import AppProfile from "./profile.js";
import AppLogon from "./logon.js";
import AppSearch from "./search.js";
import AppStory from "./story.js";
import AppTopic from "./topic.js";
import AppUser from "./user.js";
import AppOffline from "./offline.js";


export default function apps() {
  // Register apps
  customElements.define("app-home", AppHome);
  customElements.define("app-post", AppPost);
  customElements.define("app-profile", AppProfile);
  customElements.define("app-logon", AppLogon);
  customElements.define("app-search", AppSearch);
  customElements.define("app-story", AppStory);
  customElements.define("app-topic", AppTopic);
  customElements.define("app-user", AppUser);
  customElements.define("app-offline", AppOffline);
}