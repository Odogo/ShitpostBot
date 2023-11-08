import { APIEmbed, AuditLogEvent, Embed, EmbedBuilder, EmbedData, Guild, GuildAuditLogsEntry, GuildAuditLogsResolvable } from "discord.js";
import { KObject } from "./KObject";
import { LoggingConfigCategory } from '../../enums/LoggingConfigCategory';
import { LoggingConfigType } from "../../enums/LoggingConfigType";
import { client } from "../..";

export class KLogging extends KObject {

    public logEvent: AuditLogEvent;
    public loggingConfig: KLoggingObjectConfig;

    /** For the love of god, use `KLogging.baseEmbed()` */
    public embedCallback: KLoggingEmbedCallback;

    constructor(options: KLoggingOptions) {
        super("log_" + options.logEvent);

        this.logEvent = options.logEvent;
        this.loggingConfig = options.loggingConfig;
        this.embedCallback = options.embedCallback;
    }

    /**
     * Generates a base embed for any logging event. This will automatically fill in
     * - Timestamp
     * - Footer (with bot branding :3)
     * - Author (entry's executor)
     * 
     * and can be filled with any additional information with the **data** property or by property modification (`embed.color = newColor`)
     * 
     * @param entry the entry to create off of
     * @param guild the guild the entry was from
     * @param data any additional embed data
     * @returns A base embed that wont work unless given additional data
     */
    public static async baseEmbed(entry: GuildAuditLogsEntry, guild: Guild, data?: EmbedData | APIEmbed | undefined): Promise<EmbedBuilder> {
        const clientUser = client.user;
        const executor = (entry.executorId !== null ? await guild.members.fetch(entry.executorId) : null);
        
        const embed = new EmbedBuilder(data);
        embed.setTimestamp();

        if(clientUser !== null) {
            embed.setFooter({
                text: clientUser.displayName,
                iconURL: clientUser.avatarURL({ extension: 'png', size: 2048 }) || undefined
            });
        }

        if(executor !== null) {
            embed.setAuthor({
                name: (executor.nickname !== null ? executor.nickname : executor.displayName),
                iconURL: executor.avatarURL({ extension: 'png', size: 2048 }) || executor.displayAvatarURL({ extension: 'png', size: 2048 })
            });
        }

        return embed;
    }
}

export type KLoggingOptions = {
    logEvent: AuditLogEvent,
    loggingConfig: KLoggingObjectConfig,
    embedCallback: KLoggingEmbedCallback
}

type KLoggingObjectConfig = {
    type: LoggingConfigType,
    category: LoggingConfigCategory
}

type KLoggingEmbedCallback = (entry: GuildAuditLogsEntry, guild: Guild) => Promise<EmbedBuilder | null>;