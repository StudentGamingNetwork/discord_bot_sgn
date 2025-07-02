import mongoose, { Schema, Document } from "mongoose";

export interface IReactionRoleMessage extends Document {
  guildId: string;
  channelId: string;
  messageId: string;
  title?: string;
  description?: string;
}

const ReactionRoleMessageSchema = new Schema<IReactionRoleMessage>({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: false },
  title: { type: String },
  description: { type: String },
});

ReactionRoleMessageSchema.index({ guildId: 1, channelId: 1 }, { unique: true });

export default mongoose.model<IReactionRoleMessage>(
  "ReactionRoleMessage",
  ReactionRoleMessageSchema,
  "reaction_role_message"
);
