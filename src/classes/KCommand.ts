import { ChatInputApplicationCommandData, CommandInteractionOptionResolver, PermissionResolvable } from "discord.js";
import { KClient } from "./KClient";
import { KInteraction } from "../interfaces/KInteraction";

export class KCommand {
    constructor(options: TKCommandOptions) {
        Object.assign(this, options);
    }
}

export type TKCommandOptions = {
    userPermissions?: PermissionResolvable[],
    run: (client: KClient, interaction: KInteraction, options: CommandInteractionOptionResolver) => Promise<any>
} & ChatInputApplicationCommandData;