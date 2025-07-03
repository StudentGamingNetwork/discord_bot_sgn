import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  GuildMember,
} from "discord.js";
import Whitelist from "@/modules/reactionRole/models/whitelist";
import { isAuthorized } from "@/modules/reactionRole/permission";

export const whitelistShowCommand = new SlashCommandBuilder()
  .setName("whitelistshow")
  .setDescription("Afficher la liste des utilisateurs et rôles whitelistés");

export async function handleWhitelistShow(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  const member = interaction.member as GuildMember;
  console.log(
    `[DEBUG][whitelistShow] Commande reçue par ${interaction.user.tag} (ID: ${interaction.user.id}) dans le salon ${interaction.channelId}`
  );
  if (!(await isAuthorized(member))) {
    console.warn(
      `[DEBUG][whitelistShow] Permission refusée pour ${interaction.user.tag}`
    );
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
    console.warn(
      `[DEBUG][whitelistShow] Aucun utilisateur ou rôle whitelisté.`
    );
    await interaction.reply({
      content: "Aucun utilisateur ou rôle n'est whitelisté.",
      flags: 64,
    });
    return;
  }
  const users = whitelist.userIds.map((id) => `<@${id}>`).join(", ") || "Aucun";
  const roles =
    whitelist.roleIds.map((id) => `<@&${id}>`).join(", ") || "Aucun";
  console.log(
    `[DEBUG][whitelistShow] Utilisateurs : ${users} | Rôles : ${roles}`
  );
  await interaction.reply({
    content: `**Utilisateurs whitelistés :**\n${users}\n**Rôles whitelistés :**\n${roles}`,
    flags: 64,
  });
}
