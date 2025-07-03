import { EmbedBuilder, Guild, TextChannel, Client } from "discord.js";
import { IReactionRole } from "@/modules/reactionRole/models/role";
import ReactionRoleMessage from "@/modules/reactionRole/models/roleMessage";

export async function buildReactionRoleEmbed(
  roles: IReactionRole[],
  guild: Guild,
  rrMsg?: { title?: string; description?: string }
) {
  const embed = new EmbedBuilder()
    .setTitle(rrMsg?.title || "Rôles à réaction")
    .setDescription(
      rrMsg?.description ||
        "Ajoutez ou retirez un rôle en réagissant avec l'emoji correspondant."
    )
    .setColor(0x00ae86);

  for (const role of roles) {
    const guildRole = guild.roles.cache.get(role.roleId);
    const roleName = guildRole ? guildRole.name : "Rôle inconnu";
    let emojiDisplay = role.emoji;
    // Détection emoji custom (id numérique)
    const isCustomEmoji = /^\d{15,}$/.test(role.emoji);
    if (isCustomEmoji) {
      const customEmoji = guild.emojis.cache.get(role.emoji);
      if (customEmoji) {
        emojiDisplay = `<${customEmoji.animated ? "a" : ""}:${
          customEmoji.name
        }:${customEmoji.id}>`;
      }
    }
    let value = `${emojiDisplay} - ${roleName}`;
    if (role.description && role.description.trim() !== "") {
      value += ` : ${role.description}`;
    }
    embed.addFields({
      name: "\u200B",
      value,
      inline: false,
    });
  }

  return embed;
}

export async function upsertReactionRoleEmbed(
  client: Client,
  guildId: string,
  channel: TextChannel,
  guild: Guild,
  title?: string,
  description?: string
) {
  let rrMsg = await ReactionRoleMessage.findOne({
    guildId,
    channelId: channel.id,
  });
  if (title !== undefined || description !== undefined) {
    if (!rrMsg) {
      rrMsg = await ReactionRoleMessage.create({
        guildId,
        channelId: channel.id,
        messageId: "",
        title,
        description,
      });
    } else {
      if (title !== undefined) rrMsg.title = title;
      if (description !== undefined) rrMsg.description = description;
      await rrMsg.save();
    }
  }
  const roles = await (
    await import("./models/role")
  ).default.find({ guildId, channelId: channel.id });
  const embed = await buildReactionRoleEmbed(roles, guild, rrMsg || undefined);
  if (rrMsg && rrMsg.messageId) {
    try {
      const msg = await channel.messages.fetch(rrMsg.messageId);
      await msg.edit({ embeds: [embed] });
      await msg.reactions.removeAll();
      for (const role of roles) {
        await msg.react(role.emoji);
      }
      const ReactionRole = (await import("./models/role")).default;
      await ReactionRole.updateMany(
        { guildId, channelId: channel.id },
        { $set: { messageId: rrMsg.messageId } }
      );
      console.log(
        `[DEBUG][upsertReactionRoleEmbed] Tous les ReactionRole du salon ${channel.id} mis à jour avec messageId=${rrMsg.messageId}`
      );
    } catch (e) {
      const newMsg = await channel.send({ embeds: [embed] });
      rrMsg.messageId = newMsg.id;
      await rrMsg.save();
      for (const role of roles) {
        await newMsg.react(role.emoji);
      }
      const ReactionRole = (await import("./models/role")).default;
      await ReactionRole.updateMany(
        { guildId, channelId: channel.id },
        { $set: { messageId: rrMsg.messageId } }
      );
      console.log(
        `[DEBUG][upsertReactionRoleEmbed] Tous les ReactionRole du salon ${channel.id} mis à jour avec messageId=${rrMsg.messageId}`
      );
    }
  } else {
    const msg = await channel.send({ embeds: [embed] });
    if (!rrMsg) {
      await ReactionRoleMessage.create({
        guildId,
        channelId: channel.id,
        messageId: msg.id,
        title,
        description,
      });
    } else {
      rrMsg.messageId = msg.id;
      await rrMsg.save();
    }
    for (const role of roles) {
      await msg.react(role.emoji);
    }
    const ReactionRole = (await import("./models/role")).default;
    await ReactionRole.updateMany(
      { guildId, channelId: channel.id },
      { $set: { messageId: msg.id } }
    );
    console.log(
      `[DEBUG][upsertReactionRoleEmbed] Tous les ReactionRole du salon ${channel.id} mis à jour avec messageId=${msg.id}`
    );
  }
}
