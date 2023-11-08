export interface PermissionFields {
  CreateInstantInvite: boolean;
  KickMembers: boolean;
  BanMembers: boolean;
  Administrator: boolean;
  ManageChannels: boolean;
  ManageGuild: boolean;
  AddReactions: boolean;
  ViewAuditLog: boolean;
  PrioritySpeaker: boolean;
  Stream: boolean;
  ViewChannel: boolean;
  SendMessages: boolean;
  SendTTSMessages: boolean;
  ManageMessages: boolean;
  EmbedLinks: boolean;
  AttachFiles: boolean;
  ReadMessageHistory: boolean;
  MentionEveryone: boolean;
  UseExternalEmojis: boolean;
  ViewGuildInsights: boolean;
  Connect: boolean;
  Speak: boolean;
  MuteMembers: boolean;
  DeafenMembers: boolean;
  MoveMembers: boolean;
  UseVAD: boolean;
  ChangeNickname: boolean;
  ManageNicknames: boolean;
  ManageRoles: boolean;
  ManageWebhooks: boolean;
  ManageEmojisAndStickers: boolean;
  ManageGuildExpressions: boolean;
  UseApplicationCommands: boolean;
  RequestToSpeak: boolean;
  ManageEvents: boolean;
  ManageThreads: boolean;
  CreatePublicThreads: boolean;
  CreatePrivateThreads: boolean;
  UseExternalStickers: boolean;
  SendMessagesInThreads: boolean;
  UseEmbeddedActivities: boolean;
  ModerateMembers: boolean;
  ViewCreatorMonetizationAnalytics: boolean;
  UseSoundboard: boolean;
  UseExternalSounds: boolean;
  SendVoiceMessages: boolean;
}

export namespace PermissionFields {
	export function filter(flag: boolean): PermissionFields {
		
	}
}