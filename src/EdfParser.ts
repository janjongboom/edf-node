import GenericEdfParser from './GenericEdfParser';
import Edf from './Edf';
import Signal from './Signal';

const EDF_ANNOTATIONS_LABEL = 'EDF Annotations';
const SAMPLE_BYTE_LENGTH = 2;

const NUL = 0x0;
const DC4 = 0x14;
const NAK = 0x15;

const TALS_DELIMITER = Buffer.from([DC4, NUL]);
const ANNOTATIONS_DELIMITER = Buffer.from([DC4]);
const ONESET_DELIMITER = Buffer.from([NAK]);

const headerSpec = [
    { "name": "version", "length": 8 },
    { "name": "patientId", "length": 80 },
    { "name": "recordingId", "length": 80 },
    { "name": "startDate", "length": 8 },
    { "name": "startTime", "length": 8 },
    { "name": "numberOfBytes", "length": 8 },
    { "name": "reserved", "length": 44 },
    { "name": "numDataRecords", "length": 8 },
    { "name": "durationOfDataRecord", "length": 8 },
    { "name": "numSignalsInDataRecord", "length": 4 }
];

const signalSpec = [
    { "name": "label", "length": 16 },
    { "name": "transducerType", "length": 80 },
    { "name": "physicalDimensions", "length": 8 },
    { "name": "physicalMin", "length": 8 },
    { "name": "physicalMax", "length": 8 },
    { "name": "digitalMin", "length": 8 },
    { "name": "digitalMax", "length": 8 },
    { "name": "prefiltering", "length": 80 },
    { "name": "numSamplesInDataRecord", "length": 8 }
];


export default class EdfParser extends GenericEdfParser {

    protected edf: Edf | undefined;
    protected raw: Buffer | null;

    constructor(raw: Buffer | null) {
        super();
        this.raw = raw;
    }

    computeAdditionalEdfParams() {
        if (!this.edf) {
            throw new Error('edf is not loaded yet');
        }

        this.edf.numSamplesInDataRecord = 0;
        this.edf.bytesInDataRecord = 0;

        for (let signal of this.edf.getSignals()) {
            this.edf.numSamplesInDataRecord += signal.numSamplesInDataRecord;
            this.edf.bytesInDataRecord += signal.bytesInDataRecord;
        }
    }

    async parseEdfHeaders() {
        if (!this.edf) {
            throw new Error('edf is null');
        }

        if (!this.raw) {
            throw new Error('raw buffer is null');
        }

        let start = 0;
        for (let spec of headerSpec) {
            const end = start + spec.length;
            const value = this.raw.slice(start, end).toString('ascii').trim();

            switch (spec.name) {
                case 'version': this.edf.version = value; break;
                case 'patientId': this.edf.patientId = value; break;
                case 'recordingId': this.edf.recordingId = value; break;
                case 'startDate': this.edf.setStartDate(value); break;
                case 'startTime': this.edf.setStartTime(value); break;
                case 'numberOfBytes': this.edf.setNumberOfBytes(value); break;
                case 'numDataRecords': this.edf.setNumDataRecords(value); break;
                case 'durationOfDataRecord': this.edf.setDurationOfDataRecord(value); break;
                case 'numSignalsInDataRecord': this.edf.setNumSignalsInDataRecord(value); break;
                case 'bytesInDataRecord': this.edf.setBytesInDataRecord(value); break;
                case 'numSamplesInDataRecord': this.edf.setNumSamplesInDataRecord(value); break;
                case 'reserved': break;
                default: {
                    console.warn('parseEdfHeaders - Unknown field found in header', spec.name, value);
                    break;
                }
            }
            start = end;
        }
    }

    computeAdditionalSignalParams(signal: Signal) {
        if (!this.edf || this.edf.durationOfDataRecord === null) {
            throw new Error('edf is not loaded yet, or durationOfDataRecord is null');
        }

        signal.sampleDuration = this.edf.durationOfDataRecord / signal.numSamplesInDataRecord;
        signal.sampleRate = signal.numSamplesInDataRecord / this.edf.durationOfDataRecord;
        signal.bytesInDataRecord = signal.numSamplesInDataRecord * SAMPLE_BYTE_LENGTH;
    }

    async parseSignalHeaders() {
        if (!this.edf) {
            throw new Error('edf is not loaded yet');
        }

        if (!this.raw) {
            throw new Error('raw buffer is null');
        }

        const signalsCount = this.edf.numSignalsInDataRecord;
        for (let i = 0; i < signalsCount; i++) {
            this.edf.getSignals().push(new Signal());
        }
        let start = 256;

        for (let spec of signalSpec) {
            for (let signal of this.edf.getSignals()) {
                const end = start + spec.length;
                const value = this.raw.slice(start, end).toString().trim();

                switch (spec.name) {
                    case 'label': signal.label = value; break;
                    case 'transducerType': signal.transducerType = value; break;
                    case 'physicalDimensions': signal.physicalDimensions = value; break;
                    case 'physicalMin': signal.setPhysicalMin(value); break;
                    case 'physicalMax': signal.setPhysicalMax(value); break;
                    case 'digitalMin': signal.setDigitalMin(value); break;
                    case 'digitalMax': signal.setDigitalMax(value); break;
                    case 'prefiltering': signal.prefiltering = value; break;
                    case 'numSamplesInDataRecord': signal.setNumSamplesInDataRecord(value); break;
                    case 'sampleDuration': signal.setSampleDuration(value); break;
                    case 'sampleRate': signal.setSampleRate(value); break;
                    case 'bytesInDataRecord': signal.setBytesInDataRecord(value); break;
                    default: {
                        console.warn('parseSignalHeaders - Unknown header field', spec.name, value);
                        break;
                    }
                }

                start = end;
            }
        }

        this.edf.getSignals().forEach(this.computeAdditionalSignalParams.bind(this));
        this.computeAdditionalEdfParams();
    }

    async parseSignalSamples(signal: Signal, block: Buffer, timeOffset: number) {
        if (signal.sampleDuration === null) {
            throw new Error('signal sampleDuration is null');
        }

        if (!this.edf || this.edf.startTime === null) {
            throw new Error('edf is not loaded, or startTime is null');
        }

        let offset = 0;
        for (let i = 0; i < signal.numSamplesInDataRecord; i++) {
            const value = block.readInt16LE(offset);
            signal.data.push({
                time: new Date(this.edf.startTime.getTime() + (timeOffset + i * signal.sampleDuration) * 1000),
                value: value,
                duration: undefined
            });
            offset += SAMPLE_BYTE_LENGTH;
        }
    }

    splitBuffer(buffer: Buffer, delimiter: Buffer) {
        const lines = [];
        let search;
        while ((search = buffer.indexOf(delimiter)) > -1) {
            lines.push(buffer.slice(0, search));
            buffer = buffer.slice(search + delimiter.length, buffer.length);
        }
        buffer.length && lines.push(buffer);
        return lines;
    }

    async parseAnnotationSamples(signal: Signal, block: Buffer) {
        if (!this.edf || this.edf.startTime === null) {
            throw new Error('edf is not loaded, or startTime is null');
        }

        const tals = this.splitBuffer(block, TALS_DELIMITER);
        for (let tal of tals) {
            if (tal.indexOf(DC4) < 0) {
                return;
            }
            const [onset, ...rawAnnotations] = this.splitBuffer(tal, ANNOTATIONS_DELIMITER);
            const [rawStart, rawDuration = Buffer.from([NUL])] = this.splitBuffer(onset, ONESET_DELIMITER);
            const start = parseFloat(rawStart.toString());
            const duration = parseFloat(rawDuration.toString());
            for (let rawAnnotation of rawAnnotations) {
                signal.data.push({
                    time: new Date(this.edf.startTime.getTime() + start * 1000),
                    value: rawAnnotation.toString().trim(),
                    duration
                })
            }
        }
    }

    async parseDataRecord(dataRecord: Buffer, timeOffset: number) {
        if (!this.edf) {
            throw new Error('edf is not loaded');
        }

        let start = 0;
        return Promise.all(this.edf.getSignals().map(signal => {
            const end = start + signal.bytesInDataRecord;
            const block = dataRecord.slice(start, end);
            start = end;
            if (signal.label === EDF_ANNOTATIONS_LABEL) {
                return this.parseAnnotationSamples(signal, block);
            } else {
                return this.parseSignalSamples(signal, block, timeOffset);
            }
        }));
    }

    async parseSignalData() {
        if (!this.edf) {
            throw new Error('edf is not loaded');
        }

        if (this.edf.numDataRecords === null) {
            throw new Error('numDataRecords is null');
        }

        if (this.edf.durationOfDataRecord === null) {
            throw new Error('durationOfDataRecords is null');
        }

        if (!this.raw) {
            throw new Error('raw buffer is null');
        }

        let start = 256 * (this.edf.numSignalsInDataRecord + 1);
        const promises = [];
        for (let i = 0; i < this.edf.numDataRecords; i++) {
            const timeOffset = i * this.edf.durationOfDataRecord;
            const end = start + this.edf.bytesInDataRecord;
            const dataRecord = this.raw.slice(start, end);
            promises.push(this.parseDataRecord(dataRecord, timeOffset));
            start = end;
        }
        return Promise.all(promises);
    }

    async parse() {
        if (!this.edf) {
            this.edf = new Edf(this.timezone);
            await this.parseEdfHeaders();
            await this.parseSignalHeaders();
            await this.parseSignalData();
        }
        return this.edf;
    }

}

module.exports = EdfParser;