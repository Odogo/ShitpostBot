import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry, GuildAuditLogsResolvable } from "discord.js";
import { KObject } from "./KObject";
import { LoggingConfigCategory } from '../enums/LoggingConfigCategory';
import { LoggingConfigType } from "../enums/LoggingConfigType";

export class KLogging extends KObject {

    public logEvent: AuditLogEvent;
    public loggingConfig: KLoggingObjectConfig;

    public embedCallback: KLoggingEmbedCallback;

    constructor(options: KLoggingOptions) {
        super("log_" + options.logEvent);

        this.logEvent = options.logEvent;
        this.loggingConfig = options.loggingConfig;
        this.embedCallback = options.embedCallback;
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

type KLoggingEmbedCallback = (entry: GuildAuditLogsEntry) => EmbedBuilder;