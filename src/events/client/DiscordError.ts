import { Events } from "discord.js";
import { ShitEvent } from "../../structure/ShitEvent";
import { logError } from "../../system";

export default new ShitEvent(Events.Error, async debug => logError("[Discord] " + debug));