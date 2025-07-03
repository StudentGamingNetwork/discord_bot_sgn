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
  console.log(
    `[DEBUG][editRole] Commande reçue par ${interaction.user.tag} (ID: ${interaction.user.id}) dans le salon ${interaction.channelId}`
  );
  if (!isAuthorized(member)) {
    console.warn(
      `[DEBUG][editRole] Permission refusée pour ${interaction.user.tag}`
    );
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
  console.log(
    `[DEBUG][editRole] Paramètres reçus : role='${role.name}', emoji='${emoji}', description='${description}'`
  );
  const rr = await ReactionRole.findOne({
    guildId,
    channelId,
    roleId: role.id,
  });
  if (!rr) {
    console.warn(`[DEBUG][editRole] Rôle non trouvé dans la liste.`);
    await interaction.reply({
      content: "⛔ Ce rôle n'existe pas dans la liste.",
      flags: 64,
    });
    return;
  }
  if (!emoji && !description) {
    console.warn(`[DEBUG][editRole] Aucun attribut à modifier spécifié.`);
    await interaction.reply({
      content: "Veuillez spécifier au moins un attribut à modifier.",
      flags: 64,
    });
    return;
  }
  if (emoji) {
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
    }
    if (!isValidEmoji && customEmojiRegex.test(emoji) && interaction.guild) {
      const match = emoji.match(customEmojiRegex);
      const [, , id] = match || [];
      const found = id ? interaction.guild.emojis.cache.get(id) : null;
      if (found) {
        isValidEmoji = true;
        customEmojiId = id;
        emojiToStore = id;
      }
    }
    if (!isValidEmoji) {
      console.warn(`[DEBUG][editRole] Emoji invalide : '${emoji}'`);
      await interaction.reply({
        content:
          "⛔ L'emoji doit être un emoji unicode ou un emoji custom du serveur.",
        flags: 64,
      });
      return;
    }
    rr.emoji = emojiToStore;
  }
  if (description !== null && description !== undefined)
    rr.description = description;
  await rr.save();
  console.log(`[DEBUG][editRole] Rôle modifié avec succès : ${role.name}`);
  await interaction.reply({
    content: `✏️ Rôle modifié : ${emoji ? `emoji = ${emoji}` : ""}${
      emoji && description ? ", " : ""
    }${description ? `description = ${description}` : ""}`,
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
  console.log(`[DEBUG][editRole] Embed mis à jour dans le salon ${channel.id}`);
}
