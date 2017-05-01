const chai = require('chai');
chai.should();
const rimraf = require('rimraf');
const path = require('path');
const lodash = require('lodash');

const BilligtMQ = require('../src/billigt-mq');
const helpers = require('./helpers.js');

const TESTDIR = '/tmp/__tests-billigtmq';

describe('BilligtMQ', () => {
  before((done) => {
    rimraf(TESTDIR, done);
  });

  it('billigtmq requires option param', () => {
    const fn = () => {const bmq = new BilligtMQ();};
    fn.should.throw(/missing opts/);
  });

  const opts = {};
  it('billigtmq requires opts.dropboxToken', () => {
    const fn = () => {const bmq = new BilligtMQ(opts);};
    fn.should.throw(/missing dropboxToken/);
  });

  it('billigtmq requires opts.name', () => {
    opts.dropboxToken = 'foo';
    const fn = () => {const bmq = new BilligtMQ(opts);};
    fn.should.throw(/missing name/);
  });

  it('billigtmq requires valid opts.name', () => {
    opts.name = '@invalid';
    const fn = () => {const bmq = new BilligtMQ(opts);};
    fn.should.throw(/name contains invalid characters/);
  });

  let bmq;
  it('billigtmq with valid opts.name', () => {
    opts.root = path.resolve(TESTDIR, 'basic');
    opts.name = 'valid';
    bmq = new BilligtMQ(opts);
    return bmq.start()
    .then(() => helpers.expectDirs(TESTDIR, {basic: {}}));
  });

  const expectedEmptyTopic = {
    basic: {
      topic: {
        '.incoming': {error: {}, processed: {}, processing: {}, target: {}, working: {}},
        '.valid': {error: {}, processed: {}, processing: {}, target: {}, working: {}},
      },
    },
  };
  it('createTopic', () => {
    return bmq.createTopic('topic')
    .then(() => helpers.expectDirs(TESTDIR, expectedEmptyTopic))
    .catch((e) => {
      console.log('oops', e);
      throw(e);
    });
  });

  it('sendToTopic', () => {
    const msg = {foo: 'bar'};
    const gotEvent = helpers.expectEvent(bmq, 'topic');
    return bmq.sendToTopic('topic', msg)
    .then((msgFile) => {
      return gotEvent
      .then((bmqMsg) => {
        bmqMsg.should.deep.equal(msg);
        const expected = lodash.cloneDeep(expectedEmptyTopic);
        expected.basic.topic['.incoming'].processed[msgFile] = true;
        expected.basic.topic['.valid'].processed[msgFile] = true;
        return helpers.expectDirs(TESTDIR, expected)
      });
    });
  });
});
