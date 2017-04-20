'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const Promise = require('bluebird');

module.exports.assertDirExists = function(dir) {
  return new Promise((resolve) => {
    const mode = fs.constants.R_OK | fs.constants.W_OK;
    fs.access(dir, mode, (err) => {
      expect(err).not.exist;
      return resolve(!err);
    });
  });
}

function _readDirs(dir, out) {
  const readdir = Promise.promisify(fs.readdir);
  const stat = Promise.promisify(fs.stat);

  return Promise.map(readdir(dir), (file) => {
    return stat(path.resolve(dir, file))
    .then((stats) => {
      if(stats.isDirectory()) {
        out[file] = {};
        return _readDirs(path.resolve(dir, file), out[file]);
      } else {
        out[file] = true;
      }
    });
  });
}

module.exports.expectDirs = function(dir, expected) {
  const found = {};
  return _readDirs(dir, found)
  .then(() => {
    console.log('found', found);
    expect(found).to.deep.equal(expected);
  });
}
