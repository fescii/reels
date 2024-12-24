import ChatsContainer from "./chats.js";
import PinChat from "./pin.js";
import ChatItem from "./chat.js";

// register the custom element
export default function chats() {
  customElements.define("chats-container", ChatsContainer);
  customElements.define("pin-chat", PinChat, { extends: "div" });
  customElements.define("chat-item", ChatItem, { extends: "div" });
}