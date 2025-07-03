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
  console.log(
    `[DEBUG][addRole] Commande reçue par ${interaction.user.tag} (ID: ${interaction.user.id}) dans le salon ${interaction.channelId}`
  );
  if (!isAuthorized(member)) {
    console.warn(
      `[DEBUG][addRole] Permission refusée pour ${interaction.user.tag}`
    );
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
  console.log(
    `[DEBUG][addRole] Paramètres reçus : emoji='${emoji}', role='${role.name}', description='${description}'`
  );

  // Gestion avancée de l'emoji : unicode ou custom Discord
  let emojiToStore = emoji;
  let isValidEmoji = false;
  let isUnicode = false;
  let customEmojiId = null;
  const customEmojiRegex = /^<a?:([\w~]+):(\d+)>$/;
  const unicodeEmojiRegex = /^(?:\p{Emoji}|\p{Extended_Pictographic})+$/u;
  if (unicodeEmojiRegex.test(emoji)) {
    isUnicode = true;
    isValidEmoji = true;
    emojiToStore = emoji;
  } else if (customEmojiRegex.test(emoji)) {
    const match = emoji.match(customEmojiRegex);
    if (match && interaction.guild) {
      const [, name, id] = match;
      const found = interaction.guild.emojis.cache.get(id);
      if (found) {
        isValidEmoji = true;
        customEmojiId = id;
        emojiToStore = id; // On stocke l'id pour les custom
      }
    }
  }
  if (!isValidEmoji) {
    console.warn(`[DEBUG][addRole] Emoji invalide : '${emoji}'`);
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
    $or: [{ roleId: role.id }, { emoji: emojiToStore }],
  });
  if (exists) {
    console.warn(`[DEBUG][addRole] Rôle ou emoji déjà existant dans ce salon.`);
    await interaction.reply({
      content: "⛔ Ce rôle ou cet emoji est déjà dans la liste.",
      flags: 64,
    });
    return;
  }

  await ReactionRole.create({
    guildId,
    channelId,
    emoji: emojiToStore,
    roleId: role.id,
    description,
    messageId: "",
  });
  console.log(
    `[DEBUG][addRole] Rôle ajouté avec succès : ${emoji} - ${role.name}`
  );
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
    console.log(
      `[DEBUG][addRole] Embed mis à jour dans le salon ${channel.id}`
    );
  }
}
