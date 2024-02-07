import { DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { PunishType, Punishment } from '../../modules/Punishments';
import { sequelInstance } from "../..";

export class MPunishment extends Model<InferAttributes<MPunishment>, InferCreationAttributes<MPunishment>> {

    declare id: number; // Auto-incrementing primary key
    declare type: PunishType; // The type of punishment

    declare guildId: string; // The guild ID of the punishment

    declare userId: string; // The user ID of the punishment
    declare moderatorId: string; // The moderator ID of the punishment

    declare reason: string; // The reason of the punishment

    // The expiration date of the punishment (optional)
    declare expiresAt: Date | null;
    declare createdAt: Date; // The creation date of the punishment

    public static async initialize(): Promise<typeof MPunishment> {
        return this.init({
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false
            },
            guildId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            userId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            moderatorId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            reason: {
                type: DataTypes.STRING,
                allowNull: false
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        }, {
            sequelize: sequelInstance,
            modelName: "punishments",
            timestamps: false
        });
    }
}