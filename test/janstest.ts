import Path from 'path';
import fs from 'fs';
import EdfParser from '../src/EdfParser';

const raw = fs.readFileSync(Path.join(process.cwd(), 'Male35yrs_scoringC.edf'));
const parser = new EdfParser(raw);
parser.parse()
    .then(edf => {
        console.log(edf);
        console.log(edf.signals[0].data);
    })
    .catch(ex => {
        console.error('Failed to parse EDF', ex);
    });