import fs from "fs";
import EdfParser from './EdfParser';

class EdfFileParser extends EdfParser {

    private path: string;

    constructor(path: string) {
        super(null);
        this.path = path;
    }

    async readFile(): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            fs.readFile(this.path, (err, raw) => {
                err && reject(err);
                resolve(raw);
            })
        })

    }

    async parse() {
        if (!this.edf) {
            this.raw = await this.readFile();
            await super.parse();
        }
        if (!this.edf) {
            throw new Error('Failed to parse edf');
        }
        return this.edf;
    }

}

module.exports = EdfFileParser;
