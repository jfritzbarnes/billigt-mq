const chai = require('chai');
chai.should();
const rimraf = require('rimraf');
const path = require('path');

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

  it('createTopic', () => {
    return bmq.createTopic('topic')
    .then(() => helpers.expectDirs(TESTDIR, {foo: {}}))
    .catch((e) => {
      console.log('oops', e);
      throw(e);
    });
  });
});
