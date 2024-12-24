import ChatsContainer from "./chats.js";
import PinChat from "./pin.js";

// register the custom element
export default function chats() {
  customElements.define("chats-container", ChatsContainer);
  customElements.define("pin-chat", PinChat, { extends: "div" });
}