import { Events } from "discord.js";
import { KEvent } from "../../../classes/objects/KEvent";

export default new KEvent(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if(oldMember.guild.id !== "872836751520063600") return;

    console.log(oldMember.displayName);
    console.log(newMember.displayName);
});