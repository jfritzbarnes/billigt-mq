const chai = require('chai');
chai.should();
const path = require('path');
const rimraf = require('rimraf');

const LocalFS = require('../src/localfs');
const helpers = require('./helpers.js');

const TESTDIR = '/tmp/__tests-localfs';

describe('LocalFS', () => {

  before((done) => {
    rimraf(TESTDIR, done);
  });

  it('new LocalFS, using relative root', () => {
    const lfs = new LocalFS({root: 'foo'});
    lfs.root.should.equal(path.resolve(__dirname, '..', 'foo'));
  });

  it('new LocalFS, using absolute root', () => {
    const lfs = new LocalFS({root: '/foo'});
    lfs.root.should.equal('/foo');
  });

  it('create new dir', () => {
    const lfs = new LocalFS({root: path.resolve(TESTDIR, 'cnd')});
    return lfs.init()
    .then(() => {
      return lfs.createDirIfNotExists('subdir');
    })
    .then(() => helpers.assertDirExists(path.resolve(TESTDIR, 'cnd')))
    .then(() => helpers.assertDirExists(path.resolve(TESTDIR, 'cnd/subdir')))
    .then(() => helpers.expectDirs(TESTDIR, {cnd: {subdir: {}}}));
  });
});
