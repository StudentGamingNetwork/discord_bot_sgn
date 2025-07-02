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

export const addRoleCommand = new SlashCommandBuilder()
  .setName("addrole")
  .setDescription("Ajouter un rôle à la liste des rôles à réaction")
  .addStringOption((opt) =>
    opt.setName("emoji").setDescription("Emoji").setRequired(true)
  )
  .addRoleOption((opt) =>
    opt.setName("role").setDescription("Rôle à attribuer").setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName("description")
      .setDescription("Description du rôle")
      .setRequired(false)
  );

export async function handleAddRole(
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
  const emoji = interaction.options.getString("emoji", true);
  const role = interaction.options.getRole("role", true);
  const description = interaction.options.getString("description") || "";
  const guildId = interaction.guildId!;
  const channelId = interaction.channelId;

  // Vérification de l'emoji : doit être un emoji unicode ou un emoji custom du serveur
  const unicodeEmojiRegex = /^(?:\p{Emoji}|\p{Extended_Pictographic})+$/u;
  const isUnicode = unicodeEmojiRegex.test(emoji);
  const guildEmojis = interaction.guild?.emojis.cache;
  let isValidEmoji = isUnicode;
  if (!isUnicode && guildEmojis) {
    // Vérifie si l'emoji custom existe sur le serveur
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

  // Vérifier si le rôle ou l'emoji existe déjà dans ce channel
  const exists = await ReactionRole.findOne({
    guildId,
    channelId,
    $or: [{ roleId: role.id }, { emoji: emoji }],
  });
  if (exists) {
    await interaction.reply({
      content: "⛔ Ce rôle ou cet emoji est déjà dans la liste.",
      flags: 64,
    });
    return;
  }

  await ReactionRole.create({
    guildId,
    channelId,
    emoji,
    roleId: role.id,
    description,
    messageId: "",
  });
  await interaction.reply({
    content: `✅ Rôle ajouté : ${emoji} - ${role.name}`,
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
