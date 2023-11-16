import { Events } from "discord.js";
import { KEvent } from "../../../classes/objects/KEvent";
import { logWarn } from "../../../system";

export default new KEvent(Events.MessageUpdate, async (oldMsg, newMsg) => {
    try {
        
    } catch(error) {
        logWarn(error);
        console.log(error);
    }
});