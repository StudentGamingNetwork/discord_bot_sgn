import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  GuildMember,
} from "discord.js";
import Whitelist from "@/modules/reactionRole/models/whitelist";
import { isAuthorized } from "@/modules/reactionRole/permission";

export const whitelistUserCommand = new SlashCommandBuilder()
  .setName("whitelistuser")
  .setDescription("Ajouter ou retirer des utilisateurs de la whitelist")
  .addStringOption((opt) =>
    opt
      .setName("action")
      .setDescription("add ou remove")
      .setRequired(true)
      .addChoices(
        { name: "add", value: "add" },
        { name: "remove", value: "remove" }
      )
  )
  .addUserOption((opt) =>
    opt.setName("user1").setDescription("Utilisateur 1").setRequired(true)
  )
  .addUserOption((opt) =>
    opt.setName("user2").setDescription("Utilisateur 2").setRequired(false)
  )
  .addUserOption((opt) =>
    opt.setName("user3").setDescription("Utilisateur 3").setRequired(false)
  )
  .addUserOption((opt) =>
    opt.setName("user4").setDescription("Utilisateur 4").setRequired(false)
  )
  .addUserOption((opt) =>
    opt.setName("user5").setDescription("Utilisateur 5").setRequired(false)
  );

export async function handleWhitelistUser(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  const member = interaction.member as GuildMember;
  if (!(await isAuthorized(member))) {
    await interaction.reply({
      content: "⛔ Vous n'avez pas la permission.",
      flags: 64,
    });
    return;
  }
  const guildId = interaction.guildId!;
  const action = interaction.options.getString("action", true);
  const userIds: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const user = interaction.options.getUser(`user${i}`);
    if (user) userIds.push(user.id);
  }
  if (userIds.length === 0) {
    await interaction.reply({
      content: "Aucun utilisateur spécifié.",
      flags: 64,
    });
    return;
  }
  let whitelist = await Whitelist.findOne({ guildId });
  if (!whitelist) {
    whitelist = await Whitelist.create({ guildId, userIds: [], roleIds: [] });
  }
  if (action === "add") {
    whitelist.userIds = Array.from(new Set([...whitelist.userIds, ...userIds]));
  } else {
    whitelist.userIds = whitelist.userIds.filter((id) => !userIds.includes(id));
  }
  await whitelist.save();
  await interaction.reply({
    content: `✅ Utilisateurs ${
      action === "add" ? "ajoutés à" : "retirés de"
    } la whitelist.`,
    flags: 64,
  });
}
