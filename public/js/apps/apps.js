import shots from "./shots/index.js";
import chats from "./chats/index.js";

export default function apps(text) {
  shots();
  chats();
  console.log(text);
}