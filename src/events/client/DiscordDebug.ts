import { Events } from "discord.js";
import { ShitEvent } from "../../structure/ShitEvent";
import { logDebug } from "../../system";

export default new ShitEvent(Events.Debug, async debug => logDebug("[Discord] " + debug));