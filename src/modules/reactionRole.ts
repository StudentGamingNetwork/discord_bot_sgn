import { Client, Events, Interaction, SlashCommandBuilder } from "discord.js";
import { commands, handleCommand } from "./reactionRole/commands";
import ReactionRole from "@models/role";

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
    // Gérer les partials
    if (reaction.partial) await reaction.fetch();
    if (user.partial) await user.fetch();
    const member = await reaction.message.guild?.members.fetch(user.id);
    if (!member) return;
    const rr = await ReactionRole.findOne({
      guildId: reaction.message.guildId,
      messageId: reaction.message.id,
      emoji: reaction.emoji.name,
    });
    if (rr) {
      await member.roles.add(rr.roleId);
    }
  });

  client.on(Events.MessageReactionRemove, async (reaction, user, _details) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (user.partial) await user.fetch();
    const member = await reaction.message.guild?.members.fetch(user.id);
    if (!member) return;
    const rr = await ReactionRole.findOne({
      guildId: reaction.message.guildId,
      messageId: reaction.message.id,
      emoji: reaction.emoji.name,
    });
    if (rr) {
      await member.roles.remove(rr.roleId);
    }
  });
};
