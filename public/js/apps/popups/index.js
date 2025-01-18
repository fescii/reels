import JoinPopup from "./join.popup.js";
import UrlPopup from "./url.popup.js"
import StatsPopup from "./stats.popup.js"
import ContactPopup from "./contact.popup.js"
import TopicPopup from "./topic.popup.js"
import ViewsPopup from "./views.popup.js"
import PreviewPopup from "./preview.popup.js"
import NotifyPopup from "./notify.popup.js"
import PostOptions from "./options.popup.js"
import ImagePopup from "./image.popup.js"


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
}