import { APIEmbed, AuditLogEvent, ClientUser, EmbedBuilder, EmbedData, Guild, GuildAuditLogsEntry, GuildAuditLogsResolvable, GuildMember, User } from "discord.js";

export class ShitLogging<EType extends GuildAuditLogsResolvable = AuditLogEvent> {

    private _rawOptions: ShitLoggingOptions<EType>;

    private _logEvent: EType;
    private _embedCallback: ShitLoggingEmbedCallback<EType>;

    constructor(
        options: ShitLoggingOptions<EType>
    ) {
        this._rawOptions = options;

        this._logEvent = options.logEvent;
        this._embedCallback = options.embedCallback;
    }

    public get rawOptions() { return this._rawOptions; }

    public get logEvent() { return this._logEvent; }

    public async generateEmbed(
        entry: GuildAuditLogsEntry<EType>,
        guild: Guild
    ): Promise<EmbedBuilder | null> {
        return this._embedCallback(entry, guild);
    }

    /**
     * Generates a base embed for any logging event using the entry data.
     * This will automatically fill:
     * - Timestamp
     * - Footer (with executor's ID)
     * - Author (with executor's name and avatar)
     * 
     * and can be extended with additional data.
     * 
     * @param clientUser the client user (so the bot user)
     * @param entry the entry to generate the embed for
     * @param guild the guild the entry is from
     * @param data additional data to add to the embed (optional)
     * @returns an embed builder with the base data
     * @see {@link ShitLogging.fetchBaseEmbed fetchBaseEmbed} for the base embed generation
     */
    public static async fetchEntryBaseEmbed(
        clientUser: ClientUser,
        entry: GuildAuditLogsEntry,
        guild: Guild, 
        data?: EmbedData | APIEmbed | undefined
    ): Promise<EmbedBuilder> {
        return new Promise(async (resolve, reject) => {
            if(!entry.executorId) { resolve(this.fetchBaseEmbed(clientUser, undefined, data)); return; }

            await guild.members.fetch(entry.executorId).then(async (executor) => {
                return resolve(this.fetchBaseEmbed(clientUser, executor, data));
            }).catch(reject);
        });
    }

    /**
     * Generates a base embed for any logging event.
     * This will automatically fill:
     * - Timestamp
     * - Footer (with executor's ID)
     * - Author (with executor's name and avatar)
     * 
     * and can be extended with additional data.
     * 
     * @param clientUser the client user (so the bot user)
     * @param executor the executor of the event (optional)
     * @param data additional data to add to the embed (optional)
     * @see {@link ShitLogging.fetchEntryBaseEmbed fetchEntryBaseEmbed} for the entry embed generation
     */
    public static fetchBaseEmbed(
        clientUser: ClientUser,
        executor?: GuildMember | User,
        data?: EmbedData | APIEmbed
    ): EmbedBuilder {
        const embed = new EmbedBuilder(data);
        embed.setTimestamp();

        if(executor !== undefined) {
            embed.setFooter({
                text: `UID: ${executor.id}`,
                iconURL: clientUser.displayAvatarURL({ extension: 'png', size: 1024 })
            });

            embed.setAuthor({
                name: (executor instanceof GuildMember ? (executor.nickname !== null ? executor.nickname : executor.displayName) : executor.displayName),
                iconURL: executor.avatarURL({ extension: 'png', size: 1024 }) || executor.displayAvatarURL({ extension: 'png', size: 1024 })
            });
        }

        return embed;
    }
}

export type ShitLoggingOptions<EType extends GuildAuditLogsResolvable = AuditLogEvent> = {
    logEvent: EType;
    embedCallback: ShitLoggingEmbedCallback<EType>;
}

type ShitLoggingEmbedCallback<EType extends GuildAuditLogsResolvable = AuditLogEvent> = (
    entry: GuildAuditLogsEntry<EType>,
    guild: Guild
) => Promise<EmbedBuilder | null>;