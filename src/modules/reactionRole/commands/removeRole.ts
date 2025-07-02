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
  if (!isAuthorized(member)) {
    await interaction.reply({
      content: "⛔ Vous n'avez pas la permission.",
      flags: 64,
    });
    return;
  }
  const role = interaction.options.getRole("role", true);
  const guildId = interaction.guildId!;
  const channelId = interaction.channelId;
  const exists = await ReactionRole.findOne({
    guildId,
    channelId,
    roleId: role.id,
  });
  if (!exists) {
    await interaction.reply({
      content: "⛔ Ce rôle n'existe pas dans la liste.",
      flags: 64,
    });
    return;
  }
  await ReactionRole.deleteOne({ guildId, channelId, roleId: role.id });
  await interaction.reply({
    content: `❌ Rôle retiré : ${role.name}`,
    flags: 64,
  });

  // Mettre à jour l'embed
  const rrMsg = await ReactionRoleMessage.findOne({ guildId, channelId });
  let channel = interaction.channel;
  if (!channel && rrMsg) {
    channel = (await client.channels.fetch(rrMsg.channelId)) as TextChannel;
  }
  if (channel && channel.isTextBased() && channel.type === 0) {
    await upsertReactionRoleEmbed(
      client,
      guildId,
      channel as TextChannel,
      interaction.guild!
    );
  }
}
