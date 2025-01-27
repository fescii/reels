import ChatApp from "./app.js";
import PinChat from "./pin.js";
import ChatItem from "./chat.js";
import MessagingContainer from "./container.js";
import Message from "./message.js";
import ChatImages from "./images.js";
import users from "./users/index.js";

// register the custom element
export default function chats() {
  users();
  customElements.define("app-chats", ChatApp);
  customElements.define("messaging-container", MessagingContainer);
  customElements.define("pin-chat", PinChat, { extends: "div" });
  customElements.define("chat-item", ChatItem, { extends: "div" });
  customElements.define("message-item", Message, { extends: "div" });
  customElements.define("chat-images", ChatImages, { extends: "div" });
}