import { GuildMember } from "discord.js";
import Whitelist from "@/modules/reactionRole/models/whitelist";

export async function isAuthorized(member: GuildMember): Promise<boolean> {
  const guildId = member.guild.id;
  const whitelist = await Whitelist.findOne({ guildId });
  if (whitelist) {
    if (whitelist.userIds.includes(member.id)) return true;
    if (member.roles.cache.some((role) => whitelist.roleIds.includes(role.id)))
      return true;
  }
  if (member.id === member.guild.ownerId) return true;
  return false;
}
