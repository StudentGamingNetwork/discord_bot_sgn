import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  GuildMember,
  TextChannel,
} from "discord.js";
import ReactionRole from "@/modules/reactionRole/models/role";
import { isAuthorized } from "@/modules/reactionRole/permission";
import ReactionRoleMessage from "@/modules/reactionRole/models/roleMessage";
import { upsertReactionRoleEmbed } from "@/modules/reactionRole/embed";

export const removeRoleCommand = new SlashCommandBuilder()
  .setName("removerole")
  .setDescription("Retirer un rôle de la liste des rôles à réaction")
  .addRoleOption((opt) =>
    opt.setName("role").setDescription("Rôle à retirer").setRequired(true)
  );

export async function handleRemoveRole(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  const member = interaction.member as GuildMember;
  console.log(
    `[DEBUG][removeRole] Commande reçue par ${interaction.user.tag} (ID: ${interaction.user.id}) dans le salon ${interaction.channelId}`
  );
  if (!isAuthorized(member)) {
    console.warn(
      `[DEBUG][removeRole] Permission refusée pour ${interaction.user.tag}`
    );
    await interaction.reply({
      content: "⛔ Vous n'avez pas la permission.",
      flags: 64,
    });
    return;
  }
  const role = interaction.options.getRole("role", true);
  const guildId = interaction.guildId!;
  const channelId = interaction.channelId;
  console.log(`[DEBUG][removeRole] Paramètres reçus : role='${role.name}'`);
  const exists = await ReactionRole.findOne({
    guildId,
    channelId,
    roleId: role.id,
  });
  if (!exists) {
    console.warn(`[DEBUG][removeRole] Rôle non trouvé dans la liste.`);
    await interaction.reply({
      content: "⛔ Ce rôle n'existe pas dans la liste.",
      flags: 64,
    });
    return;
  }
  await ReactionRole.deleteOne({ guildId, channelId, roleId: role.id });
  console.log(`[DEBUG][removeRole] Rôle supprimé avec succès : ${role.name}`);
  await interaction.reply({
    content: `❌ Rôle retiré : ${role.name}`,
    flags: 64,
  });

  const rrMsg = await ReactionRoleMessage.findOne({ guildId, channelId });
  let channel = interaction.channel;
  if (!channel && rrMsg) {
    channel = (await client.channels.fetch(rrMsg.channelId)) as TextChannel;
  }
  if (!channel || !channel.isTextBased() || channel.type !== 0) return;
  await upsertReactionRoleEmbed(
    client,
    guildId,
    channel as TextChannel,
    interaction.guild!
  );
  console.log(
    `[DEBUG][removeRole] Embed mis à jour dans le salon ${channel.id}`
  );
}
