import { addRoleCommand, handleAddRole } from "./addRole";
import { removeRoleCommand, handleRemoveRole } from "./removeRole";
import { editRoleCommand, handleEditRole } from "./editRole";
import {
  setupReactionRolesCommand,
  handleSetupReactionRoles,
} from "./setupReactionRoles";
import { whitelistUserCommand, handleWhitelistUser } from "./whitelistUser";
import { whitelistRoleCommand, handleWhitelistRole } from "./whitelistRole";
import { whitelistShowCommand, handleWhitelistShow } from "./whitelistShow";

export const commands = [
  addRoleCommand,
  removeRoleCommand,
  editRoleCommand,
  setupReactionRolesCommand,
  whitelistUserCommand,
  whitelistRoleCommand,
  whitelistShowCommand,
];

export const handlers: Record<string, any> = {
  addrole: handleAddRole,
  removerole: handleRemoveRole,
  editrole: handleEditRole,
  setupreactionroles: handleSetupReactionRoles,
  whitelistuser: handleWhitelistUser,
  whitelistrole: handleWhitelistRole,
  whitelistshow: handleWhitelistShow,
};
