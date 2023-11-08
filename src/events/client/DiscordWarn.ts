import { Events } from "discord.js";
import { KEvent } from "../../classes/objects/KEvent";
import { logWarn } from "../../system";

export default new KEvent(Events.Warn, async (error) => {
    logWarn("[Discord] " + error);
});