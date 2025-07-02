import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  GuildMember,
} from "discord.js";
import Whitelist from "@models/whitelist";
import { isAuthorized } from "../permission";

export const whitelistShowCommand = new SlashCommandBuilder()
  .setName("whitelistshow")
  .setDescription("Afficher la liste des utilisateurs et rôles whitelistés");

export async function handleWhitelistShow(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  const member = interaction.member as GuildMember;
  if (!(await isAuthorized(member))) {
    await interaction.reply({
      content: "⛔ Vous n'avez pas la permission.",
      flags: 64,
    });
    return;
  }
  const guildId = interaction.guildId!;
  const whitelist = await Whitelist.findOne({ guildId });
  if (
    !whitelist ||
    (whitelist.userIds.length === 0 && whitelist.roleIds.length === 0)
  ) {
    await interaction.reply({
      content: "Aucun utilisateur ou rôle n'est whitelisté.",
      flags: 64,
    });
    return;
  }
  const users = whitelist.userIds.map((id) => `<@${id}>`).join(", ") || "Aucun";
  const roles =
    whitelist.roleIds.map((id) => `<@&${id}>`).join(", ") || "Aucun";
  await interaction.reply({
    content: `**Utilisateurs whitelistés :**\n${users}\n**Rôles whitelistés :**\n${roles}`,
    flags: 64,
  });
}
