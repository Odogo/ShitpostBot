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

/**
 * Builder class for creating filters for punishment lookup.
 */
export class PLookupFilterBuilder {

    private data: PLookupFilterData;

    /**
     * Constructs a new PLookupFilterBuilder instance.
     * @param data - The initial filter data.
     */
    constructor(data: PLookupFilterData) {
        this.data = data;
    }

    /**
     * Sets the user filter.
     * @param user - The user to filter by.
     * @returns The PLookupFilterBuilder instance.
     */
    public user(user: User): PLookupFilterBuilder {
        this.data.user = user;
        return this;
    }

    /**
     * Sets the guild filter.
     * @param guild - The guild to filter by.
     * @returns The PLookupFilterBuilder instance.
     */
    public guild(guild: Guild): PLookupFilterBuilder {
        this.data.guild = guild;
        return this;
    }

    /**
     * Sets the punishment type filter.
     * @param type - The punishment type to filter by.
     * @returns The PLookupFilterBuilder instance.
     */
    public punishmentType(type: PunishType): PLookupFilterBuilder {
        this.data.punishmentType = type;
        return this;
    }

    /**
     * Sets the created before filter.
     * @param date - The date to filter by.
     * @returns The PLookupFilterBuilder instance.
     */
    public createdBefore(date: Date): PLookupFilterBuilder {
        this.data.createdBefore = date;
        return this;
    }

    /**
     * Sets the created after filter.
     * @param date - The date to filter by.
     * @returns The PLookupFilterBuilder instance.
     */
    public createdAfter(date: Date): PLookupFilterBuilder {
        this.data.createdAfter = date;
        return this;
    }

    /**
     * Sets the expires before filter.
     * @param date - The date to filter by.
     * @returns The PLookupFilterBuilder instance.
     */
    public expiresBefore(date: Date): PLookupFilterBuilder {
        this.data.expiresBefore = date;
        return this;
    }

    /**
     * Sets the expires after filter.
     * @param date - The date to filter by.
     * @returns The PLookupFilterBuilder instance.
     */
    public expiresAfter(date: Date): PLookupFilterBuilder {
        this.data.expiresAfter = date;
        return this;
    }

    /**
     * Sets the punished by filter.
     * @param user - The user to filter by.
     * @returns The PLookupFilterBuilder instance.
     */
    public punishedBy(user: User): PLookupFilterBuilder {
        this.data.punishedBy = user;
        return this;
    }

    /**
     * Builds the filter options.
     * @returns The filter options.
     */
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

export async function getPunishmentById(punishmentId: number): Promise<Punishment> {
    return new Promise(async (resolve, reject) => {
        try {
            const punishment = await MPunishment.findOne({ where: { punishId: punishmentId }});
            if (punishment) {
                resolve(punishment.toPunishment());
            } else {
                reject(new Error("Punishment not found"));
            }
        } catch(reason) {
            reject(reason);
        }
    });
}

export async function getPunishmentsByUserId(userId: Snowflake): Promise<Array<Punishment>> {
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

export async function getPunishmentsByGuildId(guildId: Snowflake): Promise<Map<Snowflake, Array<Punishment>>> {
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

export async function getPunishmentsByPunishmentType(type: PunishType): Promise<Array<Punishment>> {
    return new Promise(async (resolve, reject) => {
        try {
            const punishments = await MPunishment.findAll({ where: { punishType: type }});
            resolve(punishments.map((v) => v.toPunishment()));
        } catch(reason) {
            reject(reason);
        }
    });
}

export async function getPunishmentsByPunishedBy(userId: Snowflake): Promise<Array<Punishment>> {
    return new Promise(async (resolve, reject) => {
        try {
            const punishments = await MPunishment.findAll({ where: { punishedBy: userId }});
            resolve(punishments.map((v) => v.toPunishment()));
        } catch(reason) {
            reject(reason);
        }
    });
}

export function getPunishmentsByPunishedByUser(user: User): Promise<Array<Punishment>> { return getPunishmentsByPunishedBy(user.id); }

export async function getPunishmentsByCreatedBefore(date: Date): Promise<Array<Punishment>> {
    return new Promise(async (resolve, reject) => {
        try {
            const punishments = await MPunishment.findAll({ where: { punishedAt: { [Op.lt]: date } }});
            resolve(punishments.map((v) => v.toPunishment()));
        } catch(reason) {
            reject(reason);
        }
    });
}

export async function getPunishmentsByCreatedAfter(date: Date): Promise<Array<Punishment>> {
    return new Promise(async (resolve, reject) => {
        try {
            const punishments = await MPunishment.findAll({ where: { punishedAt: { [Op.gt]: date } }});
            resolve(punishments.map((v) => v.toPunishment()));
        } catch(reason) {
            reject(reason);
        }
    });
}

export async function getPunishmentsByExpiresBefore(date: Date): Promise<Array<Punishment>> {
    return new Promise(async (resolve, reject) => {
        try {
            const punishments = await MPunishment.findAll({ where: { expiresAt: { [Op.lt]: date } }});
            resolve(punishments.map((v) => v.toPunishment()));
        } catch(reason) {
            reject(reason);
        }
    });
}

export async function getPunishmentsByExpiresAfter(date: Date): Promise<Array<Punishment>> {
    return new Promise(async (resolve, reject) => {
        try {
            const punishments = await MPunishment.findAll({ where: { expiresAt: { [Op.gt]: date } }});
            resolve(punishments.map((v) => v.toPunishment()));
        } catch(reason) {
            reject(reason);
        }
    });
}

export async function createPunishment(punishment: Punishment): Promise<Punishment> {
    return new Promise(async (resolve, reject) => {
        try {
            const punishmentModel = await MPunishment.create(punishment);
            resolve(punishmentModel.toPunishment());
        } catch(reason) {
            reject(reason);
        }
    });
}

export async function deletePunishment(punishment: Punishment): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            await MPunishment.destroy({ where: { punishId: punishment.punishId }});
            resolve();
        } catch(reason) {
            reject(reason);
        }
    });
}