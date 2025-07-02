import { Client, GatewayIntentBits, Partials } from "discord.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "", {
    dbName: process.env.DB_NAME || "discord_bot_sgn",
  })
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch((err) => console.error("Erreur MongoDB:", err));

// Chargement dynamique des modules
const modulesPath = path.join(__dirname, "modules");
fs.readdirSync(modulesPath).forEach((file) => {
  if (file.endsWith(".ts") || file.endsWith(".js")) {
    require(path.join(modulesPath, file))(client);
  }
});

client.once("ready", () => {
  console.log(`🤖 Connecté en tant que ${client.user?.tag}`);
});

client.login(process.env.BOT_TOKEN);
