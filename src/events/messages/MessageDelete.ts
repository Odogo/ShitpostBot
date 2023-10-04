import { KEvent } from "../../classes/KEvent";
import { Events } from 'discord.js';
import { LoggingType, isLoggingEnabled } from "../../modules/Logging";

export default new KEvent(Events.MessageDelete, async (msg) => {
    if(await isLoggingEnabled(msg.guild, LoggingType.MessageEvents)) {
        
    }
});