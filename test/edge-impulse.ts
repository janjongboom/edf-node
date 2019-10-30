import Path from 'path';
import fs from 'fs';
import EdfParser from '../src/EdfParser';
import Edf from '../src/Edf';

const rawEdf = fs.readFileSync(Path.join(process.cwd(), 'test', 'edf', 'Male35yrs.edf'));
const scoringEdf = fs.readFileSync(Path.join(process.cwd(), 'test', 'edf', 'Male35yrs_scoringC.edf'));
const outFolder = Path.join(process.cwd(), 'out');

if (!fs.existsSync(outFolder)) {
    fs.mkdirSync(outFolder);
}

(async function() {
    try {
        const edfParser = new EdfParser(rawEdf);
        const scoringParser = new EdfParser(scoringEdf);

        const edf = await edfParser.parse();
        const scoring = await scoringParser.parse();

        let scoringIx = 0;
        for (let scoringCategory of scoring.signals[0].data) {
            let label = scoringCategory.value.toString().toLowerCase().replace(/\s/g, '-').replace(/([^\w]+)/g, '-');
            label = label.replace('1', 'one');
            label = label.replace('2', 'two');
            label = label.replace('3', 'three');
            label = label.replace('4', 'four');
            label = label.replace('5', 'five');
            label = label.replace('6', 'six');
            label = label.replace('7', 'seven');
            label = label.replace('8', 'eight');
            label = label.replace('9', 'nine');
            label = label.replace('0', 'zero');

            let times: Date[][] = [];

            console.log('start', scoringCategory.time, 'end',
                new Date(+scoringCategory.time + (scoringCategory.duration || 0) * 1000));

            // split up in 30 sec. blocks, easier to reason with
            for (let timeS = 0; timeS < (scoringCategory.duration || 0) * 1000; timeS += 30000) {
                let duration = 30000;
                if (timeS + 30000 > (scoringCategory.duration || 0) * 1000) {
                    duration = (scoringCategory.duration || 0) * 1000 - timeS;
                }

                times.push([
                    new Date(+scoringCategory.time + timeS),
                    new Date(+scoringCategory.time + timeS + duration),
                ]);
            }

            console.log('times', times);

            for (let [ startTime, endTime ] of times) {
                let data = filterSignals(edf, startTime, endTime);
                fs.writeFileSync(Path.join(outFolder, label + scoringIx + '.json'), JSON.stringify(data), 'utf-8');
                scoringIx++;
            }
        }

        console.log('Created', scoringIx, 'files');
    }
    catch (ex) {
        console.error('Failed to parse EDF', ex);
    }
})();

function filterSignals(edf: Edf, startTime: Date, endTime: Date) {
    let signals = edf.signals.filter(s => s.data.length > 0);

    let highestSamplingRate = Math.max(...signals.map(s => s.sampleRate || 0));
    if (signals.some(s => highestSamplingRate % (s.sampleRate || 0) !== 0)) {
        throw new Error('Signals have incompatible sampling rates (highest=' + highestSamplingRate + '), ' +
            signals.map(s => s.sampleRate));
    }

    let numSamples = (
            signals.find(s => s.sampleRate === highestSamplingRate) ||
            { data: [] }
        ).data.length;


    let values: (number | string)[][] = [];

    let lastPerSignal: { [k: string]: string | number } = { };

    for (let ix = 0; ix < numSamples; ix++) {
        let valueArr: (number | string)[] = [];
        for (let signal of signals) {
            // some signals don't have an equal sampling rate, e.g.
            // if highest=128 and samplerate=32, we only want to include values every 4 times
            let increase = highestSamplingRate / (signal.sampleRate || 0);
            if (ix % increase === 0) {
                if (typeof signal.data[ix / increase] === 'undefined') {
                    console.log('trying to read', signal, 'ix', ix / increase, 'realix', ix, 'increase', increase);
                    process.exit(1);
                }

                if (signal.data[ix / increase].time < startTime || signal.data[ix / increase].time > endTime) {
                    break;
                }

                lastPerSignal[signal.label || ''] = signal.data[ix / increase].value;

                valueArr.push(signal.data[ix / increase].value);
            }
            else {
                valueArr.push(lastPerSignal[signal.label || '']);
            }
        }
        if (valueArr.length) {
            values.push(valueArr);
        }
    }

    let emptySignature = Array(64).fill('0').join('');

    let data = {
        protected: {
            ver: "v1",
            alg: "HS256",
            iat: +startTime / 1000
        },
        signature: emptySignature,
        payload: {
            device_type: edf.recordingId,
            interval_ms: (1 / highestSamplingRate) * 1000,
            sensors: signals.map(s => ({ name: s.label, units: s.physicalDimensions || '.' })),
            values: values
        }
    };

    return data;
}
