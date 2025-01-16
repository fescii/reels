import UsersModal from "./modal.js";
import UserItem from "./user.js";

// Export register function all users
export default function users() {
  customElements.define('users-modal', UsersModal);
  customElements.define('user-item', UserItem, { extends: 'div' });
}