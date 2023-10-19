import { NonThreadGuildBasedChannel } from "discord.js";

export namespace Utilities {

    export function stringedType(channel: NonThreadGuildBasedChannel) {
        switch(channel.type) {
            case 0: return "Text Channel";
            case 2: return "Voice Channel";
            case 4: return "Category";
            case 5: return "Announcement Channel";
            case 13: return "Stage Channel";
            case 15: return "Forum Channel";
            default: return "Unknown?";
        }
    }

}