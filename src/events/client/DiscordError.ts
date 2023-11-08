import { Events } from "discord.js";
import { KEvent } from "../../classes/objects/KEvent";
import { logError } from "../../system";

export default new KEvent(Events.Error, async (error) => {
    logError("[Discord] An error occured: " + error);
});