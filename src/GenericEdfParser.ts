import Edf from "./Edf";

export default class GenericEdfParser {

    public timezone: string;

    constructor(){
        this.timezone = 'UTC';
    }

    async parse(): Promise<Edf | { name: string, edf: Edf }[]> {
        throw new Error('Cannot use GenericEdfParser directly');
    };
}
