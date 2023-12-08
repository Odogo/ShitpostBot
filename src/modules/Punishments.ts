import { User } from 'discord.js';
import { MPunishment } from '../database/moderation/MPunishment';
import { WhereOptions } from 'sequelize';
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

export async function getAllPunishments(user: User): Promise<Array<Punishment>> {
    return new Promise(async (resolve, reject) => {
        await MPunishment.findAll({ where: { userId: user.id }}).then(async (value) => {
            return resolve(value.map((v) => v.toPunishment()));
        }).catch(reject);
    });
}

export async function getPunishments(user: User, type: PunishType): Promise<Array<Punishment>> {
    return new Promise(async (resolve, reject) => {
        await getAllPunishments(user).then((v) => {

        }).catch(reject);
    });
}