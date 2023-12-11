import { Guild, Snowflake, User } from 'discord.js';
import { MPunishment } from '../database/moderation/MPunishment';
import { Op, WhereOptions } from 'sequelize';

export type PunishType = "Warning" | "Timeout" | "Kick" | "Ban";

export type Punishment = {
    punishId: number; // the punishment Id

    userId: string; // who was punished
    guildId: string; // in what guild
    
    punishType: PunishType; // the punishment type
        
    punishedBy: string; // the user id of the punisher
    reason: string; // the reason for the punishment
    
    punishedAt: number; // when the punishment was created
    expiresAt: number; // when the punishment will expire
}

export type PLookupFilterData = {
    user?: User,
    guild?: Guild,
    punishmentType?: PunishType,
    createdBefore?: Date,
    createdAfter?: Date,
    expiresBefore?: Date,
    expiresAfter?: Date,
    punishedBy?: User,
}

export class PLookupFilterBuilder {

    private data: PLookupFilterData;

    constructor(data: PLookupFilterData) {
        this.data = data;
    }

    public user(user: User): PLookupFilterBuilder {
        this.data.user = user;
        return this;
    }

    public guild(guild: Guild): PLookupFilterBuilder {
        this.data.guild = guild;
        return this;
    }

    public punishmentType(type: PunishType): PLookupFilterBuilder {
        this.data.punishmentType = type;
        return this;
    }

    public createdBefore(date: Date): PLookupFilterBuilder {
        this.data.createdBefore = date;
        return this;
    }

    public createdAfter(date: Date): PLookupFilterBuilder {
        this.data.createdAfter = date;
        return this;
    }

    public expiresBefore(date: Date): PLookupFilterBuilder {
        this.data.expiresBefore = date;
        return this;
    }

    public expiresAfter(date: Date): PLookupFilterBuilder {
        this.data.expiresAfter = date;
        return this;
    }

    public punishedBy(user: User): PLookupFilterBuilder {
        this.data.punishedBy = user;
        return this;
    }

    public build(): WhereOptions<MPunishment> {
        const options: WhereOptions<MPunishment> = {};

        if(this.data.user) options.userId = this.data.user.id;
        if(this.data.guild) options.guildId = this.data.guild.id;
        if(this.data.punishmentType) options.punishType = this.data.punishmentType;
        if(this.data.punishedBy) options.punishedBy = this.data.punishedBy.id;

        if(this.data.createdAfter || this.data.createdBefore) {
            options.punishedAt = {}

            if(this.data.createdBefore)
                options.punishedAt[Op.lt] = this.data.createdBefore

            if(this.data.createdAfter)
                options.punishedAt[Op.gt] = this.data.createdAfter
        }

        if(this.data.expiresAfter || this.data.expiresBefore) {
            options.expiresAt = {}

            if(this.data.createdBefore)
                options.expiresAt[Op.lt] = this.data.expiresBefore

            if(this.data.createdAfter)
                options.expiresAt[Op.gt] = this.data.expiresAfter
        }

        return options;
    }
}

export async function getEveryPunishment(): Promise<Map<Snowflake, Array<Punishment>>> {
    return new Promise(async (resolve, reject) => {
        try {
            const punishments = (await MPunishment.findAll()).map((v) => v.toPunishment());

            const map = new Map<Snowflake, Array<Punishment>>();
            const users = new Set(punishments.map((v) => v.userId));

            for(const user of users) {
                const userPunishments = punishments.filter((v) => v.userId === user);
                map.set(user, userPunishments);
            }

            resolve(map);
        } catch(reason) {
            reject(reason);
        }
    });
}

export async function getPunishments(options?: PLookupFilterBuilder): Promise<Map<Snowflake, Array<Punishment>>> {
    return new Promise(async (resolve, reject) => {
        if(!options) { resolve(getEveryPunishment()); return; }

        try {
            const punishments = (await MPunishment.findAll({ where: options.build() })).map((v) => v.toPunishment());

            const map = new Map<Snowflake, Array<Punishment>>();
            const users = new Set(punishments.map((v) => v.userId));

            for(const user of users) {
                const userPunishments = punishments.filter((v) => v.userId === user);
                map.set(user, userPunishments);
            }

            resolve(map);
        } catch(reason) {
            reject(reason);
        }
    });
}

async function getPunishmentsByUserId(userId: Snowflake): Promise<Array<Punishment>> {
    return new Promise(async (resolve, reject) => {
        try {
            const punishments = await MPunishment.findAll({ where: { userId: userId }});
            resolve(punishments.map((v) => v.toPunishment()));
        } catch(reason) {
            reject(reason);
        }
    });
}

export function getPunishmentsByUser(user: User): Promise<Array<Punishment>> { return getPunishmentsByUserId(user.id); }

async function getPunishmentsByGuildId(guildId: Snowflake): Promise<Map<Snowflake, Array<Punishment>>> {
    return new Promise(async (resolve, reject) => {
        try {
            const punishments = await MPunishment.findAll({ where: { guildId: guildId }});

            const map = new Map<Snowflake, Array<Punishment>>();
            const users = new Set(punishments.map((v) => v.userId));

            for(const user of users) {
                const userPunishments = punishments.filter((v) => v.userId === user);
                map.set(user, userPunishments);
            }

            resolve(map)
        } catch(reason) {
            reject(reason);
        }
    });
}

export function getPunishmentsByGuild(guild: Guild): Promise<Map<Snowflake, Array<Punishment>>> { return getPunishmentsByGuildId(guild.id); }