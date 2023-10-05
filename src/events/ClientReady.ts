import { ActivityType, Events } from "discord.js";
import { KEvent } from "../classes/KEvent";
import { version } from "../../package.json";

export default new KEvent(Events.ClientReady, async (client) => {
    client.user.setActivity({
        type: ActivityType.Competing,
        name: "Shitposting (v" + version + ")"
    });
});