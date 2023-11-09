import { APIAuditLogChange, ChannelType } from "discord.js";

export namespace Utilities {

    export function channelTypeString(type: ChannelType) {
        switch(type) {
            case 0: return "Text Channel";
            case 1: return "DM";
            case 2: return "Voice Channel";
            case 3: return "Group DM";
            case 4: return "Category";
            case 5: return "Announcement Channel";
            // case 6-9 does not exist
            case 10: return "Announcement Thread";
            case 11: return "Public Thread";
            case 12: return "Private Thread";
            case 13: return "Stage Channel";
            case 14: return "Directory";
            case 15: return "Forum Channel";
            default: return "Unknown";
        }
    }

    export function auditLogKey(key: APIAuditLogChange['key']) {
        let keySplit = key.split("_");
        for(let i = 0; i < keySplit.length; i++) {
            keySplit[i] = keySplit[i].substring(0, 1).toUpperCase() + keySplit[i].substring(1).toLowerCase();
        }
        return keySplit.join(" ");
    }
}