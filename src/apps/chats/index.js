import ChatApp from "./app.js";
import PinChat from "./pin.js";
import ChatItem from "./chat.js";
import MessagingContainer from "./container.js";
import Message from "./message.js";

// register the custom element
export default function chats() {
  customElements.define("chat-app", ChatApp);
  customElements.define("messaging-container", MessagingContainer);
  customElements.define("pin-chat", PinChat, { extends: "div" });
  customElements.define("chat-item", ChatItem, { extends: "div" });
  customElements.define("message-item", Message, { extends: "div" });
}