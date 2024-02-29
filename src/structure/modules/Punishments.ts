import { Guild, User } from "discord.js";
import { MPunishments, PunishmentType } from "../database/MPunishments";

export class Punishments {

    public static async fetchPunishments(data?: PunishmentGetOptions): Promise<Array<MPunishments>> {
        return MPunishments.findAll({
            where: {
                type: data?.type,
                guildId: data?.guild?.id,
                targetUser: data?.target?.id,
                executingUser: data?.executer?.id,
                reason: data?.reason,
                createdAt: data?.createdAt,
                expiresAt: data?.expiresAt
            }
        });
    }

    public static async createPunishment(data: PunishmentCreateOptions): Promise<MPunishments> {
        return MPunishments.create({
            id: (await MPunishments.count()),
            type: data.type,
            guildId: data.guild.id,
            targetUser: data.target.id,
            executingUser: data.executer.id,
            reason: data.reason,
            createdAt: new Date(),
            expiresAt: data.expiresAt
        });
    }

    public static async deletePunishment(punishment: MPunishments): Promise<void> {
        return punishment.destroy();
    }

    public static async deletePunishments(data: PunishmentGetOptions): Promise<number> {
        return MPunishments.destroy({
            where: {
                type: data.type,
                guildId: data.guild?.id,
                targetUser: data.target?.id,
                executingUser: data.executer?.id,
                reason: data.reason,
                createdAt: data.createdAt,
                expiresAt: data.expiresAt
            }
        });
    }
}

export interface PunishmentGetOptions {
    type?: PunishmentType;
    guild?: Guild;
    target?: User;
    executer?: User;
    reason?: string;
    createdAt?: Date;
    expiresAt?: Date;
}

export interface PunishmentCreateOptions {
    type: PunishmentType;
    guild: Guild;
    target: User;
    executer: User;
    reason: string;
    expiresAt?: Date;
}