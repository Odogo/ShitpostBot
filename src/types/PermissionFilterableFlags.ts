import { PermissionsBitField } from "discord.js";
import { Utilities } from "../classes/Utilities";

export type PermissionFilterableFlags = {
	CreateInstantInvite?: boolean;
	KickMembers?: boolean;
	BanMembers?: boolean;
	Administrator?: boolean;
	ManageChannels?: boolean;
	ManageGuild?: boolean;
	AddReactions?: boolean;
	ViewAuditLog?: boolean;
	PrioritySpeaker?: boolean;
	Stream?: boolean;
	ViewChannel?: boolean;
	SendMessages?: boolean;
	SendTTSMessages?: boolean;
	ManageMessages?: boolean;
	EmbedLinks?: boolean;
	AttachFiles?: boolean;
	ReadMessageHistory?: boolean;
	MentionEveryone?: boolean;
	UseExternalEmojis?: boolean;
	ViewGuildInsights?: boolean;
	Connect?: boolean;
	Speak?: boolean;
	MuteMembers?: boolean;
	DeafenMembers?: boolean;
	MoveMembers?: boolean;
	UseVAD?: boolean;
	ChangeNickname?: boolean;
	ManageNicknames?: boolean;
	ManageRoles?: boolean;
	ManageWebhooks?: boolean;
	ManageEmojisAndStickers?: boolean;
	ManageGuildExpressions?: boolean;
	UseApplicationCommands?: boolean;
	RequestToSpeak?: boolean;
	ManageEvents?: boolean;
	ManageThreads?: boolean;
	CreatePublicThreads?: boolean;
	CreatePrivateThreads?: boolean;
	UseExternalStickers?: boolean;
	SendMessagesInThreads?: boolean;
	UseEmbeddedActivities?: boolean;
	ModerateMembers?: boolean;
	ViewCreatorMonetizationAnalytics?: boolean;
	UseSoundboard?: boolean;
	UseExternalSounds?: boolean;
	SendVoiceMessages?: boolean;
};

export function parsePermissions(permValue: bigint): PermissionFilterableFlags {
	const permissionField = new PermissionsBitField(permValue);

	return Object.entries(PermissionsBitField.Flags)
		.reduce((obj, [perm, value]) => 
			({ ...obj, [perm]: permissionField.has(value) }),
			{} as PermissionFilterableFlags);
}

export function flagsFilter(
	flags: PermissionFilterableFlags,
	value: boolean
): PermissionFilterableFlags {
	const filter: PermissionFilterableFlags = {} as PermissionFilterableFlags;
	for (const key in flags) {
		if (flags[key] === value) {
			filter[key] = flags[key];
		}
	}
	return filter;
}

export function flagsFilterFromBigInt(
	flag: bigint,
	value: boolean
): PermissionFilterableFlags {
	const flags = parsePermissions(flag);

	const filter: PermissionFilterableFlags = {} as PermissionFilterableFlags;
	for (const key in flags) {
		if (flags[key] === value) {
			filter[key] = flags[key];
		}
	}
	return filter;
}

export function flagsFindDifference(flagsA: PermissionFilterableFlags, flagsB: PermissionFilterableFlags): PermissionFilterableFlags {
	const difference: PermissionFilterableFlags = {} as PermissionFilterableFlags;

	const allKeys = new Set([...Object.keys(flagsA), ...Object.keys(flagsB)]);
	for (const key of allKeys) {
		if(flagsA[key] !== flagsB[key]) {
			difference[key] = flagsA[key];
		}
	}

	return difference;
}

export function flagsLength(flags: PermissionFilterableFlags): number {
	return Object.keys(flags).length;
}