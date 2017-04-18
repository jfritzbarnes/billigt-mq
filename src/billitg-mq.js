'use strict';

const EventEmitter = require('events');

class BilligtMQError extends Error {
  constructor(msg, code) {
    super(msg);
    this.code = code;
  }
}

class BilligtMQ extends EventEmitter {
  constructor(opts) {
    super();
    this.dropboxToken = opts.dropboxToken;
    this.topics = opts.topics ? opts.topics : [];
    if(!opts.name) throw new BilligtMQError('missing name arg', 'ENONAME');
    if(!isSafeName(opts.name)) {
      throw new BilligtMQError(`name contains invalid characters: ${opts.name}`, 'EINV');
    }
    this.name = opts.name;
    this.fs = opts.fs === 'Dropbox' ? require('./dropboxfs') : require('./localfs');
  }

  start() {
  }
  
  stop() {
  }

  createTopic(topic) {
    console.log(`createTopic(${topic})`);
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
  return /[a-z0-9A-Z\.\-_]+/.test(name);
}

module.exports = BilligtMQ;
