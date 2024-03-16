import { Client, Guild, User } from "discord.js";
import { MPunishments, PunishmentAttributes, PunishmentType } from '../database/MPunishments';
import { Op, WhereOptions } from "sequelize";

export class Punishments {

    /**
     * Fetches punishment data using the optional get options. If no options are provided, all punishments will be fetched.
     * You can filter this further by using the array of punishments and filtering it yourself.
     * @param data Optional options to filter the punishments by.
     * @returns A promise that resolves with an array of punishments that match the provided options, or all punishments if no options are provided.
     */
    public static async fetchPunishments(data?: PunishmentGetOptions): Promise<Array<MPunishments>> {
        const whereClause: WhereOptions<PunishmentAttributes> = {};

        if (data?.type) whereClause.type = data.type;
        if (data?.guild?.id) whereClause.guildId = data.guild.id;
        if (data?.target?.id) whereClause.targetUser = data.target.id;
        if (data?.executer?.id) whereClause.executingUser = data.executer.id;
        if (data?.reason) whereClause.reason = data.reason;

        if (data?.createdBefore && data?.createdAfter) {
            whereClause.createdAt = {
                [Op.and]: [
                    { [Op.lt]: data.createdBefore },
                    { [Op.gt]: data.createdAfter }
                ]
            };
        } else {
            if (data?.createdBefore) whereClause.createdAt = { [Op.lt]: data.createdBefore };
            if (data?.createdAfter) whereClause.createdAt = { [Op.gt]: data.createdAfter };
        }

        if (data?.expiresBefore && data?.expiresAfter) {
            whereClause.expiresAt = {
                [Op.and]: [
                    { [Op.lt]: data.expiresBefore },
                    { [Op.gt]: data.expiresAfter }
                ]
            };
        } else {
            if (data?.expiresBefore) whereClause.expiresAt = { [Op.lt]: data.expiresBefore };
            if (data?.expiresAfter) whereClause.expiresAt = { [Op.gt]: data.expiresAfter };
        }

        return MPunishments.findAll({ where: whereClause });
    }

    /**
     * Creates a punishment in the database using the provided data.
     * @param data The data to create the punishment with.
     * @returns A promise that resolves with the created punishment.
     */
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

    /**
     * Deletes a punishment from the database.
     * @param punishment The punishment to delete.
     * @returns A promise that resolves when the punishment has been deleted.
     */
    public static async deletePunishment(punishment: MPunishments): Promise<void> {
        return punishment.destroy();
    }

    /**
     * Deletes several punishments from the database using the provided options.
     * @param data The options to filter the punishments by.
     * @returns A promise that resolves with the number of punishments that were deleted.
     */
    public static async deletePunishments(data: PunishmentGetOptions): Promise<number> {
        return MPunishments.destroy({
            where: {
                type: data.type,
                guildId: data.guild?.id,
                targetUser: data.target?.id,
                executingUser: data.executer?.id,
                reason: data.reason,
                createdAt: {
                    [Op.and]: [
                        data.createdBefore && { [Op.lt]: data.createdBefore },
                        data.createdAfter && { [Op.gt]: data.createdAfter }
                    ]
                },
                expiresAt: {
                    [Op.and]: [
                        data.expiresBefore && { [Op.lt]: data.expiresBefore },
                        data.expiresAfter && { [Op.gt]: data.expiresAfter }
                    ]
                }
            }
        });
    }
}

/**
 * An interface for the options that can be provided when fetching punishments.
 */
export interface PunishmentGetOptions {
    type?: PunishmentType;
    guild?: Guild;
    target?: User;
    executer?: User;
    reason?: string;

    createdBefore?: Date;
    createdAfter?: Date;

    expiresBefore?: Date;
    expiresAfter?: Date;
}

/**
 * An interface for the options that can be provided when creating a punishment.
 */
export interface PunishmentCreateOptions {
    type: PunishmentType;
    guild: Guild;
    target: User;
    executer: User;
    reason: string;
    expiresAt?: Date;
}