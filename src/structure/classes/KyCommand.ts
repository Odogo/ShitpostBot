import { ChatInputApplicationCommandData, CommandInteraction, CommandInteractionOptionResolver, GuildMember, PermissionResolvable } from 'discord.js';
import { KyClient } from './KyClient';
import { KyInteraction } from '../interfaces/KyInteraction';

export class KyCommand {
    constructor(
        options: KyCommandOptions, 
    ) {
        Object.assign(this, options);
    }
}

export type KyCommandOptions = {
    userPermissions?: PermissionResolvable[];
    run: (client: KyClient, interaction: KyInteraction, options: CommandInteractionOptionResolver) => Promise<void>;
} & ChatInputApplicationCommandData;