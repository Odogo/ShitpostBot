export class SongDetails {

    public static fromJsonString(string: string): SongDetails {
        let jsonData = JSON.parse(string);

        if(jsonData != null && jsonData.songUrl && jsonData.submitterId && jsonData.submitTimestamp) {
            return new SongDetails(jsonData.songUrl, jsonData.submitterId, jsonData.submittimestamp);
        }
        
        return null;
    }

    public songUrl: string;
    public submitterId: string;
    public submitTimestamp: string;

    constructor(songUrl: string, submitterId: string, submitTimestamp: string) {
        this.songUrl = songUrl;
        this.submitterId = submitterId;
        this.submitTimestamp = submitTimestamp;
    }

    public toJsonString() { return JSON.stringify(this); }

    public toString() { return "SongDetails:{songUrl:" + this.songUrl + ", submitterId:" + this.submitterId + ", submitTimestamp:" + this.submitTimestamp + "}" }
 
}