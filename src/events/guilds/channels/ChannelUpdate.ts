import { AuditLogEvent, EmbedBuilder, Events, Guild } from 'discord.js';
import { KEvent } from "../../../classes/KEvent";
import { logWarn } from '../../../system';

export default new KEvent(Events.ChannelUpdate, async (prevChannel, newChannel) => {
    
});