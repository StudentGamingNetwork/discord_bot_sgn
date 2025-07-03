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
      console.warn(`[DEBUG][editRole] Emoji invalide : '${emoji}'`);
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
  console.log(`[DEBUG][editRole] Rôle modifié avec succès : ${role.name}`);
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
    console.log(
      `[DEBUG][editRole] Embed mis à jour dans le salon ${channel.id}`
    );
  }
}
