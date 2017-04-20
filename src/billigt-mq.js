'use strict';

const EventEmitter = require('events');
const lodash = require('lodash');

//const DropboxFS = require('./dropboxfs');
const LocalFS = require('./localfs');

class BilligtMQError extends Error {
  constructor(msg, code) {
    super(msg);
    this.code = code;
  }
}

class BilligtMQ extends EventEmitter {
  constructor(opts) {
    super();
    if(!opts) throw new BilligtMQError('missing opts; some are required', 'ENOOPTS');

    if(!opts.dropboxToken) throw new BilligtMQError('missing dropboxToken opt', 'ENOTOKEN');
    this.dropboxToken = opts.dropboxToken;
    this.topics = opts.topics ? opts.topics : [];
    if(!opts.name) throw new BilligtMQError('missing name opt', 'ENONAME');
    if(!isSafeName(opts.name)) {
      throw new BilligtMQError(`name contains invalid characters: ${opts.name}`, 'EINV');
    }
    this.name = opts.name;
    if(opts.fs === 'Dropbox') {
      throw new BilligtMQError('Dropbox not implemented', 'ENOIMPL');
    } else {
      this.root = opts.root ? opts.root : './billigtmq';
      this.fs = new LocalFS({root: this.root});
    }
  }

  start() {
    return this.fs.init()
    .then(() => this.fs.createDirIfNotExists(this.root))
    .then(() => {
      // create dirs (if they don't exist) for initial topics
      var promises = [];
      lodash.forEach(this.topics, (t) => {
        //promises.push(createTopicDirs(this, t));
        promises.push(this.createTopic(t));
      });
      return Promise.all(promises);
    });
  }
  
  stop() {
  }

  createTopic(topic) {
    console.log(`createTopic(${topic})`);
    return createTopicDirs(this, topic);
  }

  deleteTopic(topic) {
    console.log(`deleteTopic(${topic})`);
  }

  listenTopic(topic) {
    console.log(`listenTopic(${topic})`);
  }

  sendToTopic(topic, msg) {
    console.log(`sendToTopic(${topic}, ${msg})`);
  }
}

function isSafeName(name) {
  return /^[a-z0-9A-Z\.\-_]+$/.test(name);
}

function createTopicDirs(bmq, topic) {
  return bmq.fs.createDirIfNotExists(topic)
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.incoming`))
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.incoming/working`))
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.incoming/target`))
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.incoming/processing`))
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.incoming/processed`))
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.incoming/error`))
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.${bmq.name}/working`))
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.${bmq.name}/target`))
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.${bmq.name}/processing`))
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.${bmq.name}/processed`))
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.${bmq.name}/error`));
}

module.exports = BilligtMQ;
