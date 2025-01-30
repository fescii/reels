import JoinPopup from "./join.js";
import UrlPopup from "./url.js"
import StatsPopup from "./stats.js"
import ContactPopup from "./contact.js"
import TopicPopup from "./topic.js"
import ViewsPopup from "./views.js"
import PreviewPopup from "./preview.js"
import NotifyPopup from "./notify.js"
import PostOptions from "./options.js"
import ImagePopup from "./images.js"
import ActivityPopup from "./activity.js";

export default function popups() {
  // Register popups
  customElements.define("join-popup", JoinPopup);
  customElements.define("url-popup", UrlPopup);
  customElements.define("stats-popup", StatsPopup);
  customElements.define("contact-popup", ContactPopup);
  customElements.define("topic-popup", TopicPopup);
  customElements.define("views-popup", ViewsPopup);
  customElements.define("preview-popup", PreviewPopup);
  customElements.define("notify-popup", NotifyPopup);
  customElements.define("post-options", PostOptions);
  customElements.define("image-popup", ImagePopup);
  customElements.define("activity-popup", ActivityPopup);
}