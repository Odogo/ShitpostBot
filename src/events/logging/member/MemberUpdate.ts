import { Collection, EmbedBuilder, Events, Guild } from "discord.js";
import { KEvent } from "../../../classes/objects/KEvent";
import { logWarn } from "../../../system";
import { gatherChannelsForLogging, isGuildTypeLogged } from "../../../modules/Logging";
import { client } from "../../..";
import { LoggingConfigCategory } from "../../../enums/LoggingConfigCategory";
import { LoggingConfigType } from "../../../enums/LoggingConfigType";
import { KLogging } from "../../../classes/objects/KLogging";

/*
User {
  id: '788965473194737684',
  bot: false,
  system: false,
  flags: UserFlagsBitField { bitfield: 64 },
  username: 'odogo_',
  globalName: 'Kyomi Pog',
  discriminator: '0',
  avatar: '1c267837b96d7a7c69b90742601b21e6',
  banner: undefined,
  accentColor: undefined,
  avatarDecoration: null
}
User {
  id: '788965473194737684',
  bot: false,
  system: false,
  flags: UserFlagsBitField { bitfield: 64 },
  username: 'odogo_',
  globalName: 'Kyomi',
  discriminator: '0',
  avatar: '1c267837b96d7a7c69b90742601b21e6',
  banner: undefined,
  accentColor: undefined,
  avatarDecoration: null
} 
 */

export default new KEvent(Events.UserUpdate, async (oldUser, newUser) => {
	try {
		if(oldUser.partial) { oldUser = await oldUser.fetch(true); }
		if(client.user == null) return;

		const baseEmbed = new EmbedBuilder({
			title: "Member Updated",
			description: "A member in your guild updated themselves.",
			author: {
				name: newUser.globalName + (oldUser.globalName === newUser.globalName ? "": " (previously known as " + oldUser.displayName + ")"),
				iconURL: newUser.avatarURL({ extension: 'png', size: 2048 }) || undefined,
			},
			footer: {
				text: client.user.displayName,
				iconURL: client.user.avatarURL({ extension: 'png', size: 2048 }) || undefined
			},
			timestamp: Date.now(),
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
					"**Was:** " + oldUser.avatarURL({ extension: "png", size: 2048}) + "\n" +
					"**Now:** " + newUser.avatarURL({ extension: 'png', size: 2048}));
			}
		}

		if(oldUser.globalName !== newUser.globalName) {
			for(let [k, v] of embedMap) {
				if(!await isGuildTypeLogged(k, LoggingConfigType.MemberAvatar)) continue;
				
				v.setDescription(v.data.description + "\n**Name Updated**\n" + 
					"**Was:** " + oldUser.globalName + "\n" +
					"**Now:** " + newUser.globalName);
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
