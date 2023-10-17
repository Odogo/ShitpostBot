import { AuditLogEvent, EmbedBuilder, Events, NonThreadGuildBasedChannel } from "discord.js";
import { KEvent } from "../../../classes/KEvent";
import { LoggingConfigCategory, LoggingConfigType, isCategoryLogged, isTypeLogged, stringedType } from "../../../modules/Logging";
import { logWarn } from "../../../system";

export default new KEvent(Events.ChannelDelete, async (channel) => {
    
});