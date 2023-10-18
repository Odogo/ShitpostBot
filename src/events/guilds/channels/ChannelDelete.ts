import { AuditLogEvent, EmbedBuilder, Events, NonThreadGuildBasedChannel } from "discord.js";
import { KEvent } from "../../../classes/KEvent";
import { logWarn } from "../../../system";

export default new KEvent(Events.ChannelDelete, async (channel) => {
    
});