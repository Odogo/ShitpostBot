import { Events } from "discord.js";
import { ShitEvent } from "../../structure/ShitEvent";
import { client } from "../..";
import { ShitLogging } from "../../structure/ShitLogging";
import { logWarn } from "../../system";

export default new ShitEvent(Events.VoiceStateUpdate, async (oldState, newState) => {
    try {
        const { guild, member} = oldState;
        const cUser = client.user;

        if(!cUser || !member) return;

        const prevChannel = oldState.channel, newChannel = newState.channel;

        // get channels

        const embed = await ShitLogging.fetchBaseEmbed(cUser, member);

        if(newChannel === null) { // Left a voice channel
            // check if type is logged

        }
    } catch(error) {
        logWarn("[Logging - VC] Failed to handle voice state update: " + error);
        logWarn(error);
    }
});