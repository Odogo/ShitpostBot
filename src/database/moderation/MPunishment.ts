import { DataTypes, Model } from "sequelize";
import { PunishType, Punishment } from '../../modules/Punishments';
import { sequelInstance } from "../..";

export class MPunishment extends Model {

    // Identifier
    declare punishId: number;

    // Fields
    declare userId: string; // who was punished
    declare guildId: string; // in what guild

    declare punishType: PunishType; // the punishment type
    
    declare punishedBy: string; // the user id of the punisher
    declare reason: string; // the reason for the punishment

    declare punishedAt: number; // when the punishment was created
    declare expiresAt: number; // when the punishment will expire

    public toPunishment(): Punishment {
        return {
            punishId: this.punishId,
            userId: this.userId,
            guildId: this.guildId,
            punishType: this.punishType,
            punishedBy: this.punishedBy,
            reason: this.reason,
            punishedAt: this.punishedAt,
            expiresAt: this.expiresAt
        };
    }

    public static async initialize() {
        return MPunishment.init({
            punishId: {
                type: DataTypes.NUMBER,
                unique: true,
                primaryKey: true,
                allowNull: false
            },

            userId: {
                type: DataTypes.STRING,
                unique: false,
                allowNull: false
            },

            guildId: {
                type: DataTypes.STRING,
                unique: false,
                allowNull: false
            },

            punishType: {
                type: DataTypes.STRING,
                unique: false,
                allowNull: false,
                values: ["Warning", "Timeout", "Kick", "Ban"]
            },

            punishedBy: {
                type: DataTypes.STRING,
                unique: false,
                allowNull: false
            },

            reason: {
                type: DataTypes.STRING,
                unique: false,
                allowNull: true
            },

            punishedAt: {
                type: DataTypes.NUMBER,
                unique: false,
                allowNull: false
            },

            expiresAt: {
                type: DataTypes.NUMBER,
                unique: false,
                allowNull: false
            }
        }, {
            sequelize: sequelInstance,
            tableName: "punishments",
            timestamps: false
        })
    }

}