import { Events } from "discord.js";
import { KEvent } from "../../classes/KEvent";

export default new KEvent(Events.MessageCreate, async (msg) => {
    if(!msg.channel.isTextBased()) return;
    if(msg.channel.isDMBased()) return;

    if(msg.content === "-purge") {
        await msg.channel.bulkDelete(10);
    }
});