import { DataTypes, Model, Sequelize } from "sequelize";
import { InternalSettingsAttribute, defaultSettings, MSettingsKeys } from "../types/TSettings";

/**
 * A model to represent settings for every guild.
 * @author Kyomi
 */
export class MSettings extends Model implements MSettingsAttributes {

    declare guildId: string;
    declare settings: InternalSettingsAttribute;

    private declare jsonSettings: string;

    public static async initialize(sequelize: Sequelize): Promise<typeof MSettings> {
        return this.init({
            guildId: {
                type: DataTypes.STRING,
                primaryKey: true
            },
            jsonSettings: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: {}
            }
        }, {
            sequelize,
            modelName: 'settings',
            hooks: {
                afterCreate: async (instance: MSettings) => {
                    instance.settings = defaultSettings();

                    instance.jsonSettings = JSON.stringify(Array.from(instance.settings.entries()));

                    await instance.save();
                },
                afterFind: (instance: MSettings) => {
                    if (instance == null) return;

                    instance.settings = defaultSettings();
                    if (instance.jsonSettings) {
                        instance.settings = new Map(Array.from(JSON.parse(instance.jsonSettings)));
                    }
                },
                beforeSave: (instance: MSettings) => {
                    if(instance.settings) {
                        instance.jsonSettings = JSON.stringify(Array.from(instance.settings.entries()));
                    }
                }
            }
        });
    }
}

export interface MSettingsAttributes {
    guildId: string;
    settings: InternalSettingsAttribute;
}