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

  let normalSender;
  it('billigtmq with valid opts.name', () => {
    opts.root = path.resolve(TESTDIR, 'basic');
    opts.name = 'normal';
    normalSender = new BilligtMQ(opts);
    return normalSender.start()
    .then(() => helpers.expectDirs(TESTDIR, {basic: {}}));
  });

  const msgDir = {error: {}, processed: {}, processing: {}, target: {}, working: {}};
  const expectedState = {
    basic: {
      topic: {
        '.incoming': lodash.cloneDeep(msgDir),
        '.normal': lodash.cloneDeep(msgDir),
      },
    },
  };
  it('createTopic', () => {
    return normalSender.createTopic('topic')
    .then(() => helpers.expectDirs(TESTDIR, expectedState))
    .catch((e) => {
      console.log('oops', e);
      throw(e);
    });
  });

  let selfSender;
  it('create bmq with senderReceives option', () => {
    opts.name = 'self';
    opts.topics = ['topic'];
    opts.senderReceives = true;
    selfSender = new BilligtMQ(opts);
    return selfSender.start()
    .then(() => {
      expectedState.basic.topic['.self'] = lodash.cloneDeep(msgDir);
      return helpers.expectDirs(TESTDIR, expectedState)
    });
  });

  it('sendToTopic', () => {
    const msg = {foo: 'bar'};

    const gotSelf = helpers.expectEvent(selfSender, 'topic');
    return normalSender.sendToTopic('topic', msg)
    .then((msgFile) => {
      return gotSelf
      .then((bmqMsg) => {
        bmqMsg.should.deep.equal(msg);
        expectedState.basic.topic['.incoming'].processed[msgFile] = true;
        expectedState.basic.topic['.self'].processed[msgFile] = true;
        return helpers.expectDirs(TESTDIR, expectedState)
      });
    });
  });

  it('send reverse direction', () => {
    const msg = {bar: 'foo'};

    const gotNormal = helpers.expectEvent(normalSender, 'topic');
    const gotSelf = helpers.expectEvent(selfSender, 'topic');
    return selfSender.sendToTopic('topic', msg)
    .then((msgFile) => {
      return gotNormal
      .then((receivedMsg) => {
        receivedMsg.should.deep.equal(msg);
        return gotSelf;
      })
      .then(() => {
        expectedState.basic.topic['.self'].processed[msgFile] = true;
        expectedState.basic.topic['.incoming'].processed[msgFile] = true;
        expectedState.basic.topic['.normal'].processed[msgFile] = true;
        expectedState.basic.topic['.self'].processed[msgFile] = true;
        return helpers.expectDirs(TESTDIR, expectedState)
      });
    });
  });
});
