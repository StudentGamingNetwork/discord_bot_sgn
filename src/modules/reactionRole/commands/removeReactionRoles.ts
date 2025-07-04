import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  GuildMember,
  TextChannel,
} from "discord.js";
import ReactionRoleMessage from "@/modules/reactionRole/models/roleMessage";
import ReactionRole from "@/modules/reactionRole/models/role";
import { isAuthorized } from "@/modules/reactionRole/permission";

export const removeReactionRolesCommand = new SlashCommandBuilder()
  .setName("removereactionroles")
  .setDescription("Supprimer l'embed de rôles à réaction du channel courant");

export async function handleRemoveReactionRoles(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  const member = interaction.member as GuildMember;
  console.log(
    `[DEBUG][removeReactionRoles] Commande reçue par ${interaction.user.tag} (ID: ${interaction.user.id}) dans le salon ${interaction.channelId}`
  );
  if (!(await isAuthorized(member))) {
    console.warn(
      `[DEBUG][removeReactionRoles] Permission refusée pour ${interaction.user.tag}`
    );
    await interaction.reply({
      content: "⛔ Vous n'avez pas la permission.",
      flags: 64,
    });
    return;
  }
  const guildId = interaction.guildId!;
  const channelId = interaction.channelId;
  const rrMsg = await ReactionRoleMessage.findOne({ guildId, channelId });
  if (!rrMsg) {
    console.warn(
      `[DEBUG][removeReactionRoles] Aucun embed à supprimer dans ce salon.`
    );
    await interaction.reply({
      content: "Aucun embed de rôles à réaction à supprimer dans ce salon.",
      flags: 64,
    });
    return;
  }
  let channel = interaction.channel;
  if (!channel) {
    channel = (await client.channels.fetch(channelId)) as TextChannel;
  }
  if (channel && channel.isTextBased() && channel.type === 0) {
    try {
      const msg = await (channel as TextChannel).messages.fetch(
        rrMsg.messageId
      );
      await msg.delete();
      console.log(
        `[DEBUG][removeReactionRoles] Message d'embed supprimé dans le salon ${channel.id}`
      );
    } catch (e) {
      console.warn(
        `[DEBUG][removeReactionRoles] Impossible de supprimer le message d'embed : ${e}`
      );
    }
  }
  await ReactionRoleMessage.deleteOne({ guildId, channelId });
  await ReactionRole.deleteMany({ guildId, channelId });
  console.log(
    `[DEBUG][removeReactionRoles] Embed et rôles supprimés pour le salon ${channelId}`
  );
  await interaction.reply({
    content: "Embed de rôles à réaction supprimé du salon.",
    flags: 64,
  });
}
