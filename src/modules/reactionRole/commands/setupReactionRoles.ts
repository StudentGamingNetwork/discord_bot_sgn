import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  GuildMember,
  TextChannel,
} from "discord.js";
import ReactionRoleMessage from "@/modules/reactionRole/models/roleMessage";
import { upsertReactionRoleEmbed } from "@/modules/reactionRole/embed";
import { isAuthorized } from "@/modules/reactionRole/permission";

export const setupReactionRolesCommand = new SlashCommandBuilder()
  .setName("setupreactionroles")
  .setDescription("Créer ou mettre à jour le message des rôles à réaction")
  .addStringOption((opt) =>
    opt.setName("title").setDescription("Titre de l'embed").setRequired(false)
  )
  .addStringOption((opt) =>
    opt
      .setName("description")
      .setDescription("Description de l'embed")
      .setRequired(false)
  );

export async function handleSetupReactionRoles(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  const member = interaction.member as GuildMember;
  console.log(
    `[DEBUG][setupReactionRoles] Commande reçue par ${interaction.user.tag} (ID: ${interaction.user.id}) dans le salon ${interaction.channelId}`
  );
  if (!isAuthorized(member)) {
    console.warn(
      `[DEBUG][setupReactionRoles] Permission refusée pour ${interaction.user.tag}`
    );
    await interaction.reply({
      content: "⛔ Vous n'avez pas la permission.",
      flags: 64,
    });
    return;
  }
  const guildId = interaction.guildId!;
  const channelId = interaction.channelId;
  let channel = interaction.channel;
  const title = interaction.options.getString("title");
  const description = interaction.options.getString("description");
  console.log(
    `[DEBUG][setupReactionRoles] Paramètres reçus : title='${title}', description='${description}'`
  );
  const rrMsg = await ReactionRoleMessage.findOne({ guildId, channelId });
  if (!channel && rrMsg) {
    channel = (await client.channels.fetch(rrMsg.channelId)) as TextChannel;
  }
  if (!channel || !channel.isTextBased() || channel.type !== 0) {
    console.warn(`[DEBUG][setupReactionRoles] Type de salon non supporté.`);
    await interaction.reply({
      content: "Ce type de salon n'est pas supporté.",
      flags: 64,
    });
    return;
  }
  await upsertReactionRoleEmbed(
    client,
    guildId,
    channel as TextChannel,
    interaction.guild!,
    title || undefined,
    description || undefined
  );
  console.log(
    `[DEBUG][setupReactionRoles] Embed mis à jour dans le salon ${channel.id}`
  );
  await interaction.reply({
    content: "Embed des rôles à réaction mis à jour !",
    flags: 64,
  });
}
