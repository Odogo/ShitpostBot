import { AuditLogChange, Collection, PermissionFlagsBits, PermissionsBitField } from "discord.js";

export type PermFlags = {
	CreateInstantInvite: boolean | undefined;
	KickMembers: boolean | undefined;
	BanMembers: boolean | undefined;
	Administrator: boolean | undefined;
	ManageChannels: boolean | undefined;
	ManageGuild: boolean | undefined;
	AddReactions: boolean | undefined;
	ViewAuditLog: boolean | undefined;
	PrioritySpeaker: boolean | undefined;
	Stream: boolean | undefined;
	ViewChannel: boolean | undefined;
	SendMessages: boolean | undefined;
	SendTTSMessages: boolean | undefined;
	ManageMessages: boolean | undefined;
	EmbedLinks: boolean | undefined;
	AttachFiles: boolean | undefined;
	ReadMessageHistory: boolean | undefined;
	MentionEveryone: boolean | undefined;
	UseExternalEmojis: boolean | undefined;
	ViewGuildInsights: boolean | undefined;
	Connect: boolean | undefined;
	Speak: boolean | undefined;
	MuteMembers: boolean | undefined;
	DeafenMembers: boolean | undefined;
	MoveMembers: boolean | undefined;
	UseVAD: boolean | undefined;
	ChangeNickname: boolean | undefined;
	ManageNicknames: boolean | undefined;
	ManageRoles: boolean | undefined;
	ManageWebhooks: boolean | undefined;
	ManageEmojisAndStickers: boolean | undefined;
	ManageGuildExpressions: boolean | undefined;
	UseApplicationCommands: boolean | undefined;
	RequestToSpeak: boolean | undefined;
	ManageEvents: boolean | undefined;
	ManageThreads: boolean | undefined;
	CreatePublicThreads: boolean | undefined;
	CreatePrivateThreads: boolean | undefined;
	UseExternalStickers: boolean | undefined;
	SendMessagesInThreads: boolean | undefined;
	UseEmbeddedActivities: boolean | undefined;
	ModerateMembers: boolean | undefined;
	ViewCreatorMonetizationAnalytics: boolean | undefined;
	UseSoundboard: boolean | undefined;
	UseExternalSounds: boolean | undefined;
	SendVoiceMessages: boolean | undefined;
};

export function PermFlag_Default() {
	return {
		CreateInstantInvite: undefined,
		KickMembers: undefined,
		BanMembers: undefined,
		Administrator: undefined,
		ManageChannels: undefined,
		ManageGuild: undefined,
		AddReactions: undefined,
		ViewAuditLog: undefined,
		PrioritySpeaker: undefined,
		Stream: undefined,
		ViewChannel: undefined,
		SendMessages: undefined,
		SendTTSMessages: undefined,
		ManageMessages: undefined,
		EmbedLinks: undefined,
		AttachFiles: undefined,
		ReadMessageHistory: undefined,
		MentionEveryone: undefined,
		UseExternalEmojis: undefined,
		ViewGuildInsights: undefined,
		Connect: undefined,
		Speak: undefined,
		MuteMembers: undefined,
		DeafenMembers: undefined,
		MoveMembers: undefined,
		UseVAD: undefined,
		ChangeNickname: undefined,
		ManageNicknames: undefined,
		ManageRoles: undefined,
		ManageWebhooks: undefined,
		ManageEmojisAndStickers: undefined,
		ManageGuildExpressions: undefined,
		UseApplicationCommands: undefined,
		RequestToSpeak: undefined,
		ManageEvents: undefined,
		ManageThreads: undefined,
		CreatePublicThreads: undefined,
		CreatePrivateThreads: undefined,
		UseExternalStickers: undefined,
		SendMessagesInThreads: undefined,
		UseEmbeddedActivities: undefined,
		ModerateMembers: undefined,
		ViewCreatorMonetizationAnalytics: undefined,
		UseSoundboard: undefined,
		UseExternalSounds: undefined,
		SendVoiceMessages: undefined,
	};
}

export function flagsFindDifference(flagsA: PermFlags, flagsB: PermFlags): Collection<keyof PermFlags, Array<boolean | undefined>> {
	const difference: Collection<keyof PermFlags, Array<boolean | undefined>> = new Collection();

	const allKeys = new Set([...Object.keys(flagsA), ...Object.keys(flagsB)]);
	for (const key of allKeys) {
		if(flagsA[key] !== flagsB[key]) {
			difference.set(key as keyof PermFlags, [flagsA[key], flagsB[key]]);
		}
	}

	return difference;
}

export function transEmoji(flag: boolean | undefined): string {
	switch(flag) {
		case true: return ":white_check_mark:";
		case false: return ":x:";
		case undefined: return ":record_button:";
	}
}

export function flagsFilter(
	flags: PermFlags,
	value: boolean | undefined
): PermFlags {
	const filter: PermFlags = {} as PermFlags;
	for (const key in flags) {
		if (flags[key] === value) {
			filter[key] = flags[key];
		}
	}
	return filter;
}