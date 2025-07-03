import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  GuildMember,
  Role,
} from "discord.js";
import Whitelist from "@/modules/reactionRole/models/whitelist";
import { isAuthorized } from "@/modules/reactionRole/permission";

export const whitelistRoleCommand = new SlashCommandBuilder()
  .setName("whitelistrole")
  .setDescription("Ajouter ou retirer des rôles de la whitelist")
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
  .addRoleOption((opt) =>
    opt.setName("role1").setDescription("Rôle 1").setRequired(true)
  )
  .addRoleOption((opt) =>
    opt.setName("role2").setDescription("Rôle 2").setRequired(false)
  )
  .addRoleOption((opt) =>
    opt.setName("role3").setDescription("Rôle 3").setRequired(false)
  )
  .addRoleOption((opt) =>
    opt.setName("role4").setDescription("Rôle 4").setRequired(false)
  )
  .addRoleOption((opt) =>
    opt.setName("role5").setDescription("Rôle 5").setRequired(false)
  );

export async function handleWhitelistRole(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  const member = interaction.member as GuildMember;
  console.log(
    `[DEBUG][whitelistRole] Commande reçue par ${interaction.user.tag} (ID: ${interaction.user.id}) dans le salon ${interaction.channelId}`
  );
  if (!(await isAuthorized(member))) {
    console.warn(
      `[DEBUG][whitelistRole] Permission refusée pour ${interaction.user.tag}`
    );
    await interaction.reply({
      content: "⛔ Vous n'avez pas la permission.",
      flags: 64,
    });
    return;
  }
  const guildId = interaction.guildId!;
  const action = interaction.options.getString("action", true);
  const roleIds: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const role = interaction.options.getRole(`role${i}`);
    if (role) roleIds.push(role.id);
  }
  console.log(
    `[DEBUG][whitelistRole] Paramètres reçus : action='${action}', roleIds=[${roleIds.join(
      ", "
    )}]`
  );
  if (roleIds.length === 0) {
    console.warn(`[DEBUG][whitelistRole] Aucun rôle spécifié.`);
    await interaction.reply({ content: "Aucun rôle spécifié.", flags: 64 });
    return;
  }
  let whitelist = await Whitelist.findOne({ guildId });
  if (!whitelist) {
    whitelist = await Whitelist.create({ guildId, userIds: [], roleIds: [] });
  }
  if (action === "add") {
    whitelist.roleIds = Array.from(new Set([...whitelist.roleIds, ...roleIds]));
  } else {
    whitelist.roleIds = whitelist.roleIds.filter((id) => !roleIds.includes(id));
  }
  await whitelist.save();
  console.log(
    `[DEBUG][whitelistRole] Whitelist mise à jour pour le serveur ${guildId}`
  );
  await interaction.reply({
    content: `✅ Rôles ${
      action === "add" ? "ajoutés à" : "retirés de"
    } la whitelist.`,
    flags: 64,
  });
}
