'use strict';

const fs = require('fs');
const path = require('path');
const lodash = require('lodash');
const Promise = require('bluebird');

class LocalFS {
  constructor(opts) {
    if(!opts.root) {
      throw new Error('must specify root');
    }
    this.root = path.resolve(process.cwd(), opts.root);
  }

  init() {
    let curPath = '';
    const pathPieces = this.root.split(path.sep).slice(1);
    let promise = Promise.resolve();
    lodash.forEach(pathPieces, (p) => {
      curPath = curPath + path.sep + p;
      let stagePath = curPath;
      promise = promise.then(() => fsmkdirPromise(stagePath, true));
    });
    return promise;
  }

  resolve(...dirs) {
    return path.resolve(this.root, ...dirs);
  }

  createDirIfNotExists(dir) {
    const localDir = this.resolve(dir);
    return fsmkdirPromise(localDir, true);
  }

  deleteDir(dir) {
    const localDir = this.resolve(dir);
    return new Promise((resolve, reject) => {
      fs.rmdir(localDir, (err) => {
        if(err) return reject(err);
        resolve();
      });
    });
  }

  writeFile(dir, contents) {
    console.log('writeFile');
    const localDir = this.resolve(dir);
    const writeFile = Promise.promisify(fs.writeFile);
    return writeFile(localDir, contents, {flag: 'wx'});
  }

  moveFile(oldPath, newPath) {
    const localOldPath = this.resolve(oldPath);
    const localNewPath = this.resolve(newPath);
    const rename = Promise.promisify(fs.rename);
    return rename(localOldPath, localNewPath);
  }

  copyFile(existingPath, copyPath) {
    const localExistingPath = this.resolve(existingPath);
    const localCopyPath = this.resolve(copyPath);
    const link = Promise.promisify(fs.link);
    return link(localExistingPath, localCopyPath);
  }

  getSubdirs(dir) {
    const localDir = this.resolve(dir);
    const readdir = Promise.promisify(fs.readdir);
    return readdir(localDir);
  }
}

function fsmkdirPromise(dir, isExistsOK) {
  const mkdir = Promise.promisify(fs.mkdir);
  return mkdir(dir)
  .catch((err) => {
    if(isExistsOK && err.code === 'EEXIST') return;
    throw err;
  });
}

module.exports = LocalFS;
