import { ChatInputCommandInteraction, Client } from "discord.js";
import { commands, handlers } from "./commands/index";

export async function handleCommand(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  const handler = handlers[interaction.commandName];
  if (handler) {
    await handler(interaction, client);
  }
}

export { commands };
