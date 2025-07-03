import { Client, Events, Interaction, SlashCommandBuilder } from "discord.js";
import {
  commands,
  handleCommand,
} from "@/modules/reactionRole/commandsHandler";
import ReactionRole from "@/modules/reactionRole/models/role";

const GUILD_ID = process.env.GUILD_ID;
const NODE_ENV = process.env.NODE_ENV;

export = (client: Client) => {
  // Enregistrement des commandes slash à l'initialisation
  client.once(Events.ClientReady, async () => {
    if (!client.application) return;
    if (NODE_ENV === "development" && GUILD_ID) {
      await client.application.commands.set(
        commands as SlashCommandBuilder[],
        GUILD_ID
      );
      console.log("✅ Commandes slash enregistrées en guild (test)");
    } else {
      await client.application.commands.set(commands as SlashCommandBuilder[]);
      console.log("✅ Commandes slash enregistrées globalement (prod)");
    }
  });

  // Gestion des commandes
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (
      (commands as SlashCommandBuilder[]).some(
        (cmd: SlashCommandBuilder) => cmd.name === interaction.commandName
      )
    ) {
      await handleCommand(interaction, client);
    }
  });

  // Gestion des réactions pour assigner/retirer les rôles
  client.on(Events.MessageReactionAdd, async (reaction, user, _details) => {
    if (user.bot) return;
    try {
      if (reaction.partial) await reaction.fetch();
      if (user.partial) await user.fetch();
    } catch (err) {
      console.warn(
        `[DEBUG][ReactionAdd] Erreur lors du fetch des partials : ${err}`
      );
      return;
    }
    console.log(
      `[DEBUG][ReactionAdd] Réaction détectée : messageId=${reaction.message.id}, emoji=${reaction.emoji.name}, emojiId=${reaction.emoji.id}, user=${user.tag}`
    );
    const member = await reaction.message.guild?.members.fetch(user.id);
    if (!member) {
      console.warn(
        `[DEBUG][ReactionAdd] Membre non trouvé pour userId=${user.id}`
      );
      return;
    }
    let rr = null;
    if (reaction.emoji.id) {
      rr = await ReactionRole.findOne({
        guildId: reaction.message.guildId,
        messageId: reaction.message.id,
        emoji: reaction.emoji.id,
      });
    } else {
      rr = await ReactionRole.findOne({
        guildId: reaction.message.guildId,
        messageId: reaction.message.id,
        emoji: reaction.emoji.name,
      });
    }
    if (!rr) {
      console.log(
        `[DEBUG][ReactionAdd] Aucun rôle configuré pour ce message/emoji.`
      );
      return;
    }
    try {
      await member.roles.add(rr.roleId);
      console.log(
        `[DEBUG][ReactionAdd] Rôle attribué : roleId=${rr.roleId} à user=${user.tag}`
      );
    } catch (err) {
      console.warn(
        `[DEBUG][ReactionAdd] Échec de l'attribution du rôle : roleId=${rr.roleId} à user=${user.tag} - Erreur: ${err}`
      );
    }
  });

  client.on(Events.MessageReactionRemove, async (reaction, user, _details) => {
    if (user.bot) return;
    try {
      if (reaction.partial) await reaction.fetch();
      if (user.partial) await user.fetch();
    } catch (err) {
      console.warn(
        `[DEBUG][ReactionRemove] Erreur lors du fetch des partials : ${err}`
      );
      return;
    }
    console.log(
      `[DEBUG][ReactionRemove] Réaction retirée : messageId=${reaction.message.id}, emoji=${reaction.emoji.name}, emojiId=${reaction.emoji.id}, user=${user.tag}`
    );
    const member = await reaction.message.guild?.members.fetch(user.id);
    if (!member) {
      console.warn(
        `[DEBUG][ReactionRemove] Membre non trouvé pour userId=${user.id}`
      );
      return;
    }
    let rr = null;
    if (reaction.emoji.id) {
      rr = await ReactionRole.findOne({
        guildId: reaction.message.guildId,
        messageId: reaction.message.id,
        emoji: reaction.emoji.id,
      });
    } else {
      rr = await ReactionRole.findOne({
        guildId: reaction.message.guildId,
        messageId: reaction.message.id,
        emoji: reaction.emoji.name,
      });
    }
    if (!rr) {
      console.log(
        `[DEBUG][ReactionRemove] Aucun rôle configuré pour ce message/emoji.`
      );
      return;
    }
    try {
      await member.roles.remove(rr.roleId);
      console.log(
        `[DEBUG][ReactionRemove] Rôle retiré : roleId=${rr.roleId} à user=${user.tag}`
      );
    } catch (err) {
      console.warn(
        `[DEBUG][ReactionRemove] Échec du retrait du rôle : roleId=${rr.roleId} à user=${user.tag} - Erreur: ${err}`
      );
    }
  });
};
