import ChatsContainer from "./chats.js";

// register the custom element
export default function chats() {
  customElements.define("chats-container", ChatsContainer);
}