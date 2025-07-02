import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  GuildMember,
  TextChannel,
} from "discord.js";
import ReactionRole from "@models/role";
import { isAuthorized } from "../permission";
import ReactionRoleMessage from "@models/roleMessage";
import { upsertReactionRoleEmbed } from "../embed";

export const editRoleCommand = new SlashCommandBuilder()
  .setName("editrole")
  .setDescription("Modifier l'emoji ou la description d'un rôle à réaction")
  .addRoleOption((opt) =>
    opt.setName("role").setDescription("Rôle à modifier").setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName("emoji").setDescription("Nouvel emoji").setRequired(false)
  )
  .addStringOption((opt) =>
    opt
      .setName("description")
      .setDescription("Nouvelle description")
      .setRequired(false)
  );

export async function handleEditRole(
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
  const emoji = interaction.options.getString("emoji");
  const description = interaction.options.getString("description");
  const guildId = interaction.guildId!;
  const channelId = interaction.channelId;

  const rr = await ReactionRole.findOne({
    guildId,
    channelId,
    roleId: role.id,
  });
  if (!rr) {
    await interaction.reply({
      content: "⛔ Ce rôle n'existe pas dans la liste.",
      flags: 64,
    });
    return;
  }
  if (!emoji && !description) {
    await interaction.reply({
      content: "Veuillez spécifier au moins un attribut à modifier.",
      flags: 64,
    });
    return;
  }
  if (emoji) {
    // Vérification de l'emoji : doit être un emoji unicode ou un emoji custom du serveur
    const unicodeEmojiRegex = /^(?:\p{Emoji}|\p{Extended_Pictographic})+$/u;
    const isUnicode = unicodeEmojiRegex.test(emoji);
    const guildEmojis = interaction.guild?.emojis.cache;
    let isValidEmoji = isUnicode;
    if (!isUnicode && guildEmojis) {
      isValidEmoji = guildEmojis.some(
        (e) =>
          `<:${e.name}:${e.id}>` === emoji ||
          `<a:${e.name}:${e.id}>` === emoji ||
          e.identifier === emoji.replace(/<a?:|>/g, "")
      );
    }
    if (!isValidEmoji) {
      await interaction.reply({
        content:
          "⛔ L'emoji doit être un emoji unicode ou un emoji custom du serveur.",
        flags: 64,
      });
      return;
    }
    rr.emoji = emoji;
  }
  if (description !== null && description !== undefined)
    rr.description = description;
  await rr.save();
  await interaction.reply({
    content: `✏️ Rôle modifié : ${emoji ? `emoji = ${emoji}` : ""}${
      emoji && description ? ", " : ""
    }${description ? `description = ${description}` : ""}`,
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
