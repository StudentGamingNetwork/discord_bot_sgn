import mongoose, { Schema, Document } from "mongoose";

export interface IReactionRole extends Document {
  guildId: string;
  channelId: string;
  messageId?: string;
  emoji: string;
  roleId: string;
  description?: string;
}

const ReactionRoleSchema = new Schema<IReactionRole>({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: false },
  emoji: { type: String, required: true },
  roleId: { type: String, required: true },
  description: { type: String },
});

export default mongoose.model<IReactionRole>(
  "ReactionRole",
  ReactionRoleSchema,
  "reaction_role"
);
