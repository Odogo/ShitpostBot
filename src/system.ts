export class LogLevel {
    color: string;
    name: string;
    icon: string;

    constructor(color: string, name: string, icon: string) {
        this.color = color;
        this.name = name;
        this.icon = icon;
    }

    static readonly ERROR = new LogLevel("\x1b[31m", "ERROR", "⛔");
    static readonly INFO  = new LogLevel("\x1b[32m", "INFO",  "🔷");
    static readonly WARN  = new LogLevel("\x1b[33m", "WARN",  "🔶");
    static readonly DEBUG = new LogLevel("\x1b[34m", "DEBUG", "🔧");
}

export function log(level: LogLevel, printable: any) {
    let dateFormat = new Date().toLocaleString('en-us', { timeZone: 'America/Chicago', timeStyle: 'medium', dateStyle: 'short'});

    console.log(level.color + level.icon + " [" + dateFormat + "] [" + level.name.toUpperCase() + "]", printable);
}

export function logInfo(printable: any) { log(LogLevel.INFO, printable); }
export function logWarn(printable: any) { log(LogLevel.WARN, printable); }
export function logError(printable: any) { log(LogLevel.ERROR, printable); }
export function logDebug(printable: any) { log(LogLevel.DEBUG, printable); }