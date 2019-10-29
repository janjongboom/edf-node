import Path from 'path';
import fs from 'fs';
import chai from 'chai';
import moment from 'moment-timezone';
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));
import EdfParser from '../src/EdfParser';
import EdfFileParser from '../src/EdfFileParser';
import EdfZipParser from '../src/EdfZipParser';
import assert from 'assert';

describe('EdfParser', function () {
    it("Should parse raw edf data", function (done) {
        const raw = fs.readFileSync(Path.join(process.cwd(), 'test', 'edf', 'annotations.edf'));
        const parser = new EdfParser(raw);
        parser.parse()
            .then(edf => {
                assert.equal(edf.signals.length, 1);
                const signal = edf.signals[0];
                assert.equal(signal.data.length, 42226);
                done();
            })
            .catch(done);
    });
    it("Should read test edf file and parse it", function (done) {
        const parser = new EdfFileParser(Path.join(process.cwd(), 'test', 'edf', 'annotations.edf'));
        parser.parse()
            .then(edf => {
                assert.equal(edf.signals.length, 1);
                const signal = edf.signals[0];
                assert.equal(signal.data.length, 42226);
                done();
            })
            .catch(done);
    });
    it("Should read test edf file and throw exception", function (done) {
        const parser = new EdfFileParser(Path.join(process.cwd(), 'test', 'edf', '0001.wmedf'));
        parser.parse().should.be.rejected.and.notify(done);
    });
    it("Should read test zip file and parse all edfs in it", function (done) {
        const parser = new EdfZipParser(Path.join(process.cwd(), 'test', 'edf', 'edf.zip'), {
            filter: /^.*\.edf\+?$/
        });
        parser.parse()
            .then(data => {
                assert.equal(data.length, 2);
                data.should.contain.a.thing.with.property('name', 'annotations.edf');
                data.should.contain.a.thing.with.property('name', 'annotations.edf+');
                const edf0 = data[0].edf;
                const edf1 = data[1].edf;
                assert.equal(edf0.signals.length, 1);
                const signal0 = edf0.signals[0];
                assert.equal(signal0.data.length, 42226);
                assert.equal(edf1.signals.length, 1);
                const signal1 = edf1.signals[0];
                assert.equal(signal1.data.length, 42226);
                done();
            })
            .catch(done);
    });
    it("Should read test zip file and parse all edfs in it", function (done) {
        this.timeout(25000);
        const parser = new EdfZipParser(Path.join(process.cwd(), 'test', 'edf', 'edf1.zip'), {
            filter: /^.*\.edf\+?$/
        });
        parser.parse()
            .then(() => done())
            .catch(done);
    });
    it("Should respect provided timezone", function (done) {
        const parser = new EdfFileParser(Path.join(process.cwd(), 'test', 'edf', 'annotations.edf'));
        parser.timezone = 'CET';
        parser.parse()
            .then(edf => {
                if (!edf.startTime) {
                    false.should.be.true('false', 'edf.startTime is null');
                    return done();
                }

                const same = moment(edf.startTime).isSame('2017-01-07T23:58:58.000Z');
                same.should.be.true;
                done();
            })
            .catch(done);
    })
});