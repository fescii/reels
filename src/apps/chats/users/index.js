import UsersModal from "./modal.js";

// Export register function all users
export default function users() {
  customElements.define('users-modal', UsersModal);
}