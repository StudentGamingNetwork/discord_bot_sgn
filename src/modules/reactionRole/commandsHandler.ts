import { ChatInputCommandInteraction, Client } from "discord.js";
import { commands, handlers } from "@/modules/reactionRole/commands";

export async function handleCommand(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  const handler = handlers[interaction.commandName];
  console.log(
    `[DEBUG] Commande reçue : ${interaction.commandName} par ${interaction.user.tag}`
  );
  if (handler) {
    await handler(interaction, client);
  } else {
    console.warn(
      `[DEBUG] Aucun handler trouvé pour la commande : ${interaction.commandName}`
    );
  }
}

export { commands };
