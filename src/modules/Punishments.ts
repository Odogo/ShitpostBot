import { Client, Guild, Snowflake, User } from 'discord.js';
import { MPunishment } from '../database/moderation/MPunishment';
import { Op, WhereOptions } from 'sequelize';

export type PunishType = "Warning" | "Timeout" | "Kick" | "Ban";

export interface Punishment {
    id: number; // Auto-incrementing primary key
    type: PunishType; // The type of punishment

    guildId: string; // The guild ID of the punishment

    userId: string; // The user ID of the punishment
    moderatorId: string; // The moderator ID of the punishment

    reason: string; // The reason of the punishment

    expiresAt: Date | null; // The expiration date of the punishment
    createdAt: Date; // The creation date of the punishment
}

export async function createPunishment(guild: Guild, target: User, moderator: User, type: PunishType, reason: string, expiresAt?: Date): Promise<Punishment> {
    return await MPunishment.create({
        id: (await MPunishment.count()) + 1,
        type,

        guildId: guild.id,
        
        userId: target.id,
        moderatorId: moderator.id,

        reason,

        expiresAt,
        createdAt: new Date()
    });
}

export async function getPunishments(client: Client): Promise<Map<User, Array<Punishment>>> {
    const punishments = await MPunishment.findAll();
    const map = new Map<User, Array<Punishment>>();

    for (const punishment of punishments) {
        const user = await client.users.fetch(punishment.userId).catch(() => null);
        if (!user) continue;

        if (!map.has(user)) map.set(user, []);
        map.get(user)?.push(punishment);
    }

    return map;
}

export async function getPunishmentsByUser(user: User): Promise<Array<Punishment>> {
    return await MPunishment.findAll({ where: { userId: user.id } });
}

export async function getPunishmentsByGuild(guild: Guild): Promise<Map<User, Array<Punishment>>> {
    const punishments = await MPunishment.findAll({ where: { guildId: guild.id } });
    const map = new Map<User, Array<Punishment>>();

    for (const punishment of punishments) {
        const user = await guild.client.users.fetch(punishment.userId).catch(() => null);
        if (!user) continue;

        if (!map.has(user)) map.set(user, []);
        map.get(user)?.push(punishment);
    }

    return map;
}

export async function getPunishmentsByType(type: PunishType): Promise<Map<User, Array<Punishment>>> {
    const punishments = await MPunishment.findAll({ where: { type } });
    const map = new Map<User, Array<Punishment>>();

    for (const punishment of punishments) {
        const user = await punishment.client.users.fetch(punishment.userId).catch(() => null);
        if (!user) continue;

        if (!map.has(user)) map.set(user, []);
        map.get(user)?.push(punishment);
    }

    return map;
}

export async function getPunishmentsByModerator(moderator: User): Promise<Array<Punishment>> {
    return await MPunishment.findAll({ where: { moderatorId: moderator.id } });
}