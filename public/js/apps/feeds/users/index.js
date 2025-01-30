import PeopleFeed from "./people.js";
import UsersFeed from "./users.js";


export default function users() {
  // Register feeds
  customElements.define("people-feed", PeopleFeed);
  customElements.define("users-feed", UsersFeed)
}