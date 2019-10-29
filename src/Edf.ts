import Signal from "./Signal";
import moment from 'moment-timezone';

const EDF_DATE_REGEX = /^.*(\d{2}-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4}).*$/;

export default class Edf {

    public signals: Signal[] = [];
    private timezone: string;
    private _version: string | null;
    private _patientId: string | null;
    private _recordingId: string | null;
    private _startDate: Date | null;
    private _startTime: Date | null;
    private _numberOfBytes: number | null;
    private _numDataRecords: number | null;
    private _durationOfDataRecord: number | null;
    private _numSignalsInDataRecord: number;
    private _bytesInDataRecord: number;
    private _numSamplesInDataRecord: number;

    constructor(timezone: string) {
        this.timezone = timezone;

        this._version = null;
        this._patientId = null;
        this._recordingId = null;
        this._startDate = null;
        this._startTime = null;
        this._numberOfBytes = null;
        this._numDataRecords = null;
        this._durationOfDataRecord = null;
        this._numSignalsInDataRecord = 0;
        this._bytesInDataRecord = 0;
        this._numSamplesInDataRecord = 0;
    }

    getSignals() {
        return this.signals;
    }

    get version() {
        return this._version;
    }

    set version(value) {
        this._version = value;
    }

    get patientId() {
        return this._patientId;
    }

    set patientId(value) {
        this._patientId = value;
    }

    get recordingId() {
        return this._recordingId;
    }

    set recordingId(value) {
        this._recordingId = value;
    }

    get startDate() {
        return this._startDate;
    }

    setStartDate(value: string) {
        if (!this.recordingId) {
            throw new Error('No recording ID yet, set this first before calling setStartDate');
        }

        let match = this.recordingId.match(EDF_DATE_REGEX);
        if (match) {
            this._startDate = moment.tz(`${match[1]}`, 'DD-MMM-YYYY', this.timezone).toDate();
        } else {
            const dateParts = value.split('.').map(part => parseInt(part, 10));
            let year = dateParts[2];
            if (year < 0 || year > 99) {
                throw new Error('Invalid start date');
            }
            if (year < 84) {
                year += 2000;
            }
            else {
                year += 1900;
            }
            this._startDate = moment.tz({
                year,
                month: dateParts[1] - 1,
                day: dateParts[0]
            }, this.timezone).toDate();
        }

    }

    get startTime() {
        return this._startTime;
    }

    set startTime(value) {
        this._startTime = value;
    }

    setStartTime(value: string) {
        if (!this.startDate) {
            throw new Error('startDate not set, but is required before calling setStartTime');
        }

        let timeParts = value.split('.').map(part => parseInt(part, 10));
        this._startTime = moment(this.startDate).add(moment.duration({
            hours: timeParts[0],
            minutes: timeParts[1],
            seconds: timeParts[2]
        })).toDate();
    }

    get numberOfBytes() {
        return this._numberOfBytes;
    }

    set numberOfBytes(value) {
        this._numberOfBytes = value;
    }

    setNumberOfBytes(value: string) {
        this._numberOfBytes = parseInt(value, 10);
    }

    get numDataRecords() {
        return this._numDataRecords;
    }

    set numDataRecords(value) {
        this._numDataRecords = value;
    }

    setNumDataRecords(value: string) {
        this._numDataRecords = parseInt(value, 10);
    }

    get durationOfDataRecord() {
        return this._durationOfDataRecord;
    }

    set durationOfDataRecord(value) {
        this._durationOfDataRecord = value;
    }

    setDurationOfDataRecord(value: string) {
        this._durationOfDataRecord = parseFloat(value);
    }

    get numSignalsInDataRecord() {
        return this._numSignalsInDataRecord;
    }

    set numSignalsInDataRecord(value) {
        this._numSignalsInDataRecord = value;
    }

    setNumSignalsInDataRecord(value: string) {
        this._numSignalsInDataRecord = parseInt(value, 10);
    }

    get bytesInDataRecord() {
        return this._bytesInDataRecord;
    }

    set bytesInDataRecord(value) {
        this._bytesInDataRecord = value;
    }

    setBytesInDataRecord(value: string) {
        this._bytesInDataRecord = parseInt(value, 10);
    }

    get numSamplesInDataRecord() {
        return this._numSamplesInDataRecord;
    }

    set numSamplesInDataRecord(value) {
        this._numSamplesInDataRecord = value;
    }

    setNumSamplesInDataRecord(value: string) {
        this._numSamplesInDataRecord = parseInt(value, 10);
    }
}
