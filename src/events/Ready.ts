import { ActivityType, Events } from "discord.js";
import { ShitEvent } from "../structure/ShitEvent";
import { version } from "../../package.json";

export default new ShitEvent(Events.ClientReady, async (client) => {
    client.user.setActivity({ name: "Shitposting [v" + version + "]", type: ActivityType.Competing })
});