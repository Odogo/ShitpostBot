import {
	AuditLogEvent,
	GuildAuditLogsEntryExtraField,
	NonThreadGuildBasedChannel,
	PermissionsBitField,
	PermissionsString,
	Role,
} from "discord.js";
import { KLogging } from "../../../classes/objects/KLogging";
import { LoggingConfigType } from "../../../enums/LoggingConfigType";
import { LoggingConfigCategory } from "../../../enums/LoggingConfigCategory";
import { EmbedColors } from "../../../modules/Logging";
import { PermFlag_Default, flagsFindDifference, transEmoji } from "../../../types/PermissionFilterableFlags";

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
				(extra instanceof Role ? "<@&" + extra.id + ">" : "<@" + extra.id + ">") + "\n" + 
				"with the following changes:\n",
            fields: [
                { name: "Channel", value: "<#" + channel.id + ">" }
            ]
		});

		const allowChange = entry.changes.find((v) => v.key === "allow");
		const denyChange = entry.changes.find((v) => v.key === "deny");

		let oldFlags = PermFlag_Default(), newFlags = PermFlag_Default();

		if(allowChange) {
			let allowOld = new PermissionsBitField(BigInt(allowChange.old + "")), allowNew = new PermissionsBitField(BigInt(allowChange.new + ""));
			
			const allowOldSer = allowOld.serialize();
			for(const key in allowOldSer) {
				if(allowOldSer[key] === true)
					oldFlags[key] = true;
			}

			const allowNewSer = allowNew.serialize();
			for(const key in allowNewSer) {
				if(allowNewSer[key] === true) 
					newFlags[key] = true;
			}
		}

		if(denyChange) {
			let denyOld = new PermissionsBitField(BigInt(denyChange.old + "")), denyNew = new PermissionsBitField(BigInt(denyChange.new + ""));
			
			const denyOldSer = denyOld.serialize();
			for(const key in denyOldSer) {
				if(denyOldSer[key] === true) 
					oldFlags[key] = false;
			}

			const denyNewSer = denyNew.serialize();
			for(const key in denyNewSer) {
				if(denyNewSer[key] === true) 
					newFlags[key] = false;
			}
		}

		const difference = flagsFindDifference(oldFlags, newFlags);
		let diffMsg = "";
		for(let i=0; i<difference.size; i++) {
			let indexKey = difference.keyAt(i);
			if(!indexKey) continue;

			let diff = difference.get(indexKey);
			if(!diff) continue;

			diffMsg += "- **" + indexKey + ":** Changed from " + transEmoji(diff[0]) + " to " + transEmoji(diff[1]) + "\n";
		}

		embed.setDescription(embed.data.description + diffMsg);

		return embed;
	},
});