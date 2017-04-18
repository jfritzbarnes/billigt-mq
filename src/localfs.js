'use strict';

const fs = require('fs');
const path = require('path');
const lodash = require('lodash');

class LocalFS {
  constructor(opts) {
    if(!opts.root) {
      throw new Error('must specify root');
    }
    this.root = path.resolve(process.cwd(), opts.root);
  }

  init() {
    return new Promise((resolve) => {
      let curPath = '';
      const pathPieces = this.root.split(path.sep).slice(1);
      var promises = [];
      lodash.forEach(pathPieces, (p) => {
        curPath = curPath + path.sep + p;
        promises.push(fsmkdirPromise(curPath, true));
      });
      Promise.all(promises)
      .then(() => {
        resolve(this);
      });
    });
  }

  createDirIfNotExists(dir) {
    const newDir = path.resolve(this.root, dir);
    return fsmkdirPromise(newDir, true);
  }

  deleteDir(dir) {
    const resolvedDir = path.resolve(this.root, dir);
    return new Promise((resolve, reject) => {
      fs.rmdir(resolvedDir, (err) => {
        if(err) return reject(err);
        resolve();
      });
    });
  }
}

function fsmkdirPromise(dir, isExistsOK) {
  return new Promise((resolve, reject) => {
    fs.mkdir(dir, (err) => {
      if(!err) return resolve();
      if(isExistsOK && err.code === 'EEXIST') {
        return resolve();
      } else {
        return reject();
      }
    });
  });
}

module.exports = LocalFS;
