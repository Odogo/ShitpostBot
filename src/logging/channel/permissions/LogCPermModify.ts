import {
	AuditLogEvent,
	GuildAuditLogsEntryExtraField,
	NonThreadGuildBasedChannel,
	Role,
} from "discord.js";
import { KLogging } from "../../../classes/objects/KLogging";
import { LoggingConfigType } from "../../../enums/LoggingConfigType";
import { LoggingConfigCategory } from "../../../enums/LoggingConfigCategory";
import { EmbedColors } from "../../../modules/Logging";
import {
	parsePermissions,
	flagsFindDifference,
	PermissionFilterableFlags,
} from "../../../types/PermissionFilterableFlags";

export default new KLogging({
	logEvent: AuditLogEvent.ChannelOverwriteUpdate,
	loggingConfig: {
		type: LoggingConfigType.ChannelModify,
		category: LoggingConfigCategory.GuildEvents,
	},

	embedCallback: async (entry, guild) => {
		const extra =
			entry.extra as GuildAuditLogsEntryExtraField[AuditLogEvent.ChannelOverwriteCreate];
		const channel = entry.target as NonThreadGuildBasedChannel;

		const embed = await KLogging.baseEmbed(entry, guild, {
			color: EmbedColors.change,
			description:
				"A [channel's](" +
				channel.url +
				") permissions override modified\n" +
				(extra instanceof Role
					? "<@&" + extra.id + ">"
					: "<@" + extra.id + ">") +
				"\nwith the following changes:\n",
            fields: [
                { name: "Channel", value: "<#" + channel.id + ">" }
            ]
		});

		const oldAllowChange = entry.changes.find((v) => v.key === "allow");
		const oldDenyChange = entry.changes.find((v) => v.key === "deny");

		const oldAllow =
			typeof oldAllowChange?.old === "number"
				? parsePermissions(BigInt(oldAllowChange.old))
				: ({} as PermissionFilterableFlags);
		const oldDeny =
			typeof oldDenyChange?.old === "number"
				? parsePermissions(BigInt(oldDenyChange.old))
				: ({} as PermissionFilterableFlags);
		const newAllow =
			typeof oldAllowChange?.new === "number"
				? parsePermissions(BigInt(oldAllowChange.new))
				: ({} as PermissionFilterableFlags);
		const newDeny =
			typeof oldDenyChange?.new === "number"
				? parsePermissions(BigInt(oldDenyChange.new))
				: ({} as PermissionFilterableFlags);

		const oldDiff = flagsFindDifference(oldAllow, oldDeny);
		const newDiff = flagsFindDifference(newAllow, newDeny);

		const comparisonMessage: string[] = [];
		for (const key in oldDiff) {
			const oldValue = oldDiff[key] ? ":x:" : ":white_check_mark:";
			const newValue = newDiff[key] ? ":x:" : ":white_check_mark:";

			if (key in newDiff) {
				if (oldValue !== newValue) {
					comparisonMessage.push(
						`- **${key}**: Changed from ${oldValue} to ${newValue}`
					);
				} else {
					comparisonMessage.push(
						`- **${key}**: Changed from ${oldValue} to :record_button: `
					);
				}
			} else {
				comparisonMessage.push(
					`- **${key}**: Changed from ${oldValue} to :record_button: `
				);
			}
		}

		for (const key in newDiff) {
			if (!(key in oldDiff)) {
				const newValue = newDiff[key] ? ":x:" : ":white_check_mark:";
				comparisonMessage.push(
					`- **${key}**: Changed from :record_button:  to ${newValue}`
				);
			}
		}

		if (comparisonMessage.length > 0) {
			embed.setDescription(
				embed.data.description + comparisonMessage.join("\n") + "\n"
			);
		} else {
			embed.setDescription(embed.data.description + "No permission changes.\n");
		}

		return embed;
	},
});
