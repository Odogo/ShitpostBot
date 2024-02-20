import { Events } from "discord.js";
import { ShitEvent } from "../../structure/ShitEvent";
import { logWarn } from "../../system";

export default new ShitEvent(Events.Warn, async debug => logWarn("[Discord] " + debug));