import { EmbedBuilder, Events } from "discord.js";
import { KEvent } from "../../../classes/KEvent";
import { LoggingConfigCategory, LoggingConfigType, isCategoryLogged, isTypeLogged } from "../../../modules/Logging";
import { logWarn } from "../../../system";

export default new KEvent(Events.GuildMemberAdd, async (member) => {
    
});