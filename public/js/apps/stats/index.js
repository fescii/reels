//import all stats
import ActivityItem from "./activity.item.js";
import AllStat from "./all.stat.js";
import RepliesStat from "./replies.stat.js"
import StoriesStat from './stories.stat.js'
import UsersStat from "./users.stat.js"
import MonthStat from "./month.stat.js"
import UpdateItem from "./update.item.js"

export default function stats() {
  // Register stats
  customElements.define("activity-item", ActivityItem);
  customElements.define("all-stat", AllStat);
  customElements.define("replies-stat", RepliesStat);
  customElements.define("stories-stat", StoriesStat);
  customElements.define("users-stat", UsersStat);
  customElements.define("month-stat", MonthStat);
  customElements.define("update-item", UpdateItem);
}