const chai = require('chai');
chai.should();
const path = require('path');
const rimraf = require('rimraf');

const LocalFS = require('../src/localfs');
const helpers = require('./helpers.js');

describe('LocalFS', () => {

  before((done) => {
    rimraf('/tmp/__tests', done);
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
    const lfs = new LocalFS({root: '/tmp/__tests/cnd'});
    return lfs.init()
    .then(() => {
      return lfs.createDirIfNotExists('subdir');
    })
    .then(() => helpers.assertDirExists('/tmp/__tests/cnd'))
    .then(() => helpers.assertDirExists('/tmp/__tests/cnd/subdir'));
  });
});
