import Zip from 'adm-zip';
import GenericEdfParser from './GenericEdfParser';
import EdfParser from './EdfParser';
import Edf from './Edf';

export interface EdfZipParserOptions {
    filter: RegExp | ((entry: any) => boolean);
};

const defaultOptions = {
    filter: /^.*\.edf$/
};

export default class EdfZipParser extends GenericEdfParser {

    private path: string;
    private options: EdfZipParserOptions;
    private zip: Zip;
    private data: {
        name: string,
        edf: Edf
    }[] | undefined;

    constructor(path: string, options: EdfZipParserOptions) {
        super();

        this.path = path;
        this.options = Object.assign({}, defaultOptions, options);
        this.zip = new Zip(this.path);
    }

    async parseEntry(entry: { entryName: string }) {
        const raw: Buffer = await new Promise(
            (resolve, reject) => this.zip.readFileAsync(entry.entryName, (data, err) => {
                if (err) {
                    return reject(err);
                }
                if (!data) {
                    return reject('parsed zip file, but buffer is null');
                }
                resolve(data);
            })
        );
        const parser = new EdfParser(raw);
        parser.timezone = this.timezone;
        return parser.parse()
            .then((edf: Edf) => ({
                name: entry.entryName,
                edf: edf
            }));
    }

    async parse() {
        if (!this.data) {
            let filter: (entry: { entryName: string }) => boolean;
            if (typeof this.options.filter === 'function') {
                filter = this.options.filter;
            }
            else {
                filter = (entry: { entryName: string}) => {
                    if (this.options.filter instanceof RegExp) {
                        return this.options.filter.test(entry.entryName);
                    }
                    else {
                        return false;
                    }
                };
            }

            const entries = this.zip.getEntries();
            const edfEntries = entries.filter(filter);
            this.data = await Promise.all(edfEntries.map(this.parseEntry.bind(this)));
        }
        return this.data;
    }
}
