import { Client, Guild, User } from "discord.js";
import { DataTypes, Model, Sequelize } from "sequelize";

export class MPunishments extends Model<PunishmentAttributes> implements PunishmentAttributes {
    declare id: number;
    declare type: PunishmentType;
    
    declare guildId: string;
    declare targetUser: string;
    declare executingUser: string;

    declare reason: string;
    declare createdAt: Date;
    declare expiresAt: Date | null;

    public static async initialize(sequelize: Sequelize): Promise<typeof MPunishments> {
        return this.init({
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            type: {
                type: DataTypes.ENUM('warning', 'timeout', 'kick', 'ban'),
                allowNull: false
            },
            guildId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            targetUser: {
                type: DataTypes.STRING,
                allowNull: false
            },
            executingUser: {
                type: DataTypes.STRING,
                allowNull: false
            },
            reason: {
                type: DataTypes.STRING,
                allowNull: false
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: new Date()
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'punishments',
            timestamps: false
        });
    }

    public getType(): string {
        return this.type.charAt(0).toUpperCase() + this.type.slice(1);
    }

    public async fetchGuild(client: Client): Promise<Guild> { return client.guilds.fetch(this.guildId); }
    public async fetchTarget(client: Client): Promise<User> { return client.users.fetch(this.targetUser); }
    public async fetchExecutor(client: Client): Promise<User> { return client.users.fetch(this.executingUser); }

    public isExpired(): boolean { return this.expiresAt !== null && this.expiresAt.getTime() < Date.now(); }
    public isPermanent(): boolean { return this.expiresAt === null; }
    public timeLeft(): number { return this.expiresAt === null ? 0 : this.expiresAt.getTime() - Date.now(); }

    public timeLeftFormatted(sayPerm = true): string {
        if (this.expiresAt === null) return (sayPerm ? "Permanent" : "Never");
        return "<t:" + Math.floor(this.expiresAt.getTime() / 1000) + ":R>";
    }

    public formattedCreatedAt(): string { return "<t:" + Math.floor(this.createdAt.getTime() / 1000) + ":F>"; }
    public formattedExpiresAt(): string { return this.expiresAt === null ? "Never" : "<t:" + Math.floor(this.expiresAt.getTime() / 1000) + ":F>"; }
}

export type PunishmentType = 'warning' | 'timeout' | 'kick' | 'ban';

export interface PunishmentAttributes {
    id: number;
    type: 'warning' | 'timeout' | 'kick' | 'ban';
    
    guildId: string;
    targetUser: string;
    executingUser: string;

    reason: string;
    createdAt: Date;
    expiresAt: Date | null;
}