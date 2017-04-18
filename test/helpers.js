'use strict';

const fs = require('fs');
const expect = require('chai').expect;

module.exports.assertDirExists = function(dir) {
  return new Promise((resolve) => {
    const mode = fs.constants.R_OK | fs.constants.W_OK;
    fs.access(dir, mode, (err) => {
      expect(err).not.exist;
      return resolve(!err);
    });
  });
}
