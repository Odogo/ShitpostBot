import { Collection, EmbedBuilder, Events, Guild } from "discord.js";
import { KEvent } from "../../../classes/objects/KEvent";
import { logWarn } from "../../../system";
import { EmbedColors, gatherChannelsForLogging, isGuildTypeLogged } from "../../../modules/Logging";
import { client } from "../../..";
import { LoggingConfigCategory } from "../../../enums/LoggingConfigCategory";
import { LoggingConfigType } from "../../../enums/LoggingConfigType";
import { KLogging } from "../../../classes/objects/KLogging";

export default new KEvent(Events.UserUpdate, async (oldUser, newUser) => {
	try {
		console.log("event fired");
		if(oldUser.partial) { oldUser = await oldUser.fetch(true); }
		if(client.user == null) return;

		const baseEmbed = await KLogging.baseEmbedNoEntry(newUser, {
			color: EmbedColors.change,
			description: "A member (<@" + newUser.id + ">) in your guild updated themselves.\n"
		}); 

		const embedMap = new Collection<Guild, EmbedBuilder>();
		for(let [k, v] of await client.guilds.fetch()) {
			const guild = await v.fetch();

			let c = await gatherChannelsForLogging(guild, LoggingConfigCategory.GuildMemberEvents);
			if(c.length <= 0) continue;
			embedMap.set(guild, baseEmbed);
		}

		if(oldUser.avatar !== newUser.avatar) {
			for(let [k, v] of embedMap) {
				if(!await isGuildTypeLogged(k, LoggingConfigType.MemberAvatar)) continue;
				
				v.setDescription(v.data.description + "\n**Avatar Updated**\n" + 
					newUser.avatarURL({ extension: 'png', size: 2048}));
				v.setThumbnail(newUser.avatarURL({ extension: 'png', size: 2048}));
			}
		}

		if(oldUser.globalName !== newUser.globalName) {
			for(let [k, v] of embedMap) {
				if(!await isGuildTypeLogged(k, LoggingConfigType.MemberAvatar)) continue;
				
				v.setDescription(v.data.description + "\n**Name Updated**\n" + 
					"Changed from **" + oldUser.globalName + "** to **" + newUser.globalName + "**");
			}
		}

		for(let [k, v] of embedMap) {
			let loggingChannels = await gatherChannelsForLogging(k, LoggingConfigCategory.GuildMemberEvents);
			for(let i=0; i<loggingChannels.length; i++) {
				loggingChannels[i].send({ embeds: [v] });
			}
		}
	} catch(error) {
		logWarn("Failed to log event UserUpdate: " + error);
		logWarn(error);
	}
});
