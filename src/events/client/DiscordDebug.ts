import { Events } from "discord.js";
import { KEvent } from "../../classes/objects/KEvent";
import { logDebug, logError } from "../../system";

export default new KEvent(Events.Debug, async (error) => {
    logDebug("[Discord] " + error);
});