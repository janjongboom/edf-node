export default class Signal {

    private _label: string | null;
    private _transducerType: string | null;
    private _physicalDimensions: string | null;
    private _physicalMin: number | null;
    private _physicalMax: number | null;
    private _digitalMin: number | null;
    private _digitalMax: number | null;
    private _prefiltering: string | null;
    private _numSamplesInDataRecord: number;
    private _sampleDuration: number | null;
    private _sampleRate: number | null;
    private _bytesInDataRecord: number;

    public data: {
        // Observed time for the event
        time: Date,
        // Value is either a string (when we're doing annotations) or a number (for normal sensor readings)
        value: number | string,
        // Duration in seconds
        duration?: number
    }[] = [];

    constructor() {
        this._label = null;
        this._transducerType = null;
        this._physicalDimensions = null;
        this._physicalMin = null;
        this._physicalMax = null;
        this._digitalMin = null;
        this._digitalMax = null;
        this._prefiltering = null;
        this._numSamplesInDataRecord = 0;
        this._sampleDuration = null;
        this._sampleRate = null;
        this._bytesInDataRecord = 0;
    }

    get label() {
        return this._label;
    }

    set label(value) {
        this._label = value;
    }

    get transducerType() {
        return this._transducerType;
    }

    set transducerType(value) {
        this._transducerType = value;
    }

    get physicalDimensions() {
        return this._physicalDimensions;
    }

    set physicalDimensions(value) {
        this._physicalDimensions = value;
    }

    get physicalMin() {
        return this._physicalMin;
    }

    set physicalMin(value) {
        this._physicalMin = value;
    }

    setPhysicalMin(value: string) {
        this._physicalMin = parseFloat(value);
    }

    get physicalMax() {
        return this._physicalMax;
    }

    setPhysicalMax(value: string) {
        this._physicalMax = parseFloat(value);
    }

    get digitalMin() {
        return this._digitalMin;
    }

    set digitalMin(value) {
        this._digitalMin = value;
    }

    setDigitalMin(value: string) {
        this._digitalMin = parseInt(value, 10);
    }

    get digitalMax() {
        return this._digitalMax;
    }

    set digitalMax(value) {
        this._digitalMax = value;
    }

    setDigitalMax(value: string) {
        this._digitalMax = parseInt(value, 10);
    }

    get prefiltering() {
        return this._prefiltering;
    }

    set prefiltering(value) {
        this._prefiltering = value;
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

    get sampleDuration() {
        return this._sampleDuration;
    }

    set sampleDuration(value) {
        this._sampleDuration = value;
    }

    setSampleDuration(value: string) {
        this._sampleDuration = parseFloat(value);
    }

    get sampleRate() {
        return this._sampleRate;
    }

    set sampleRate(value) {
        this._sampleRate = value;
    }

    setSampleRate(value: string) {
        this._sampleRate = parseFloat(value);
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
}
