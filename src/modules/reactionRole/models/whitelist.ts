import mongoose, { Schema, Document } from "mongoose";

export interface IWhitelist extends Document {
  guildId: string;
  userIds: string[];
  roleIds: string[];
}

const WhitelistSchema = new Schema<IWhitelist>({
  guildId: { type: String, required: true, unique: true },
  userIds: { type: [String], default: [] },
  roleIds: { type: [String], default: [] },
});

export default mongoose.model<IWhitelist>(
  "Whitelist",
  WhitelistSchema,
  "whitelist"
);
