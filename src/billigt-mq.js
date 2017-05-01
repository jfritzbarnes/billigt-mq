'use strict';

const EventEmitter = require('events');
const lodash = require('lodash');
const shortid = require('shortid');

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
    this.listeners = {};
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
    return createTopicDirs(this, topic)
    .then(() => this.listenTopic(topic));
  }

  deleteTopic(topic) {
    console.log(`deleteTopic(${topic})`);
  }

  listenTopic(topic) {
    console.log(`listenTopic(${topic})`);
    return createTopicSubscriberDirs(this, topic)
    .then(() => {
      if(!this.listeners[topic]) {
        const watcher = this.fs.watchDir(`topic/.${this.name}/target`);
        watcher.on('add', (filename) => {
          handleListen(this, topic, 'unknown', filename);
          console.log(`FS watch event: event=<unknown>, filename=${filename}`);
        });
        this.listeners[topic] = watcher;
      }
    });
  }

  sendToTopic(topic, msg) {
    console.log(`sendToTopic(${topic}, ${msg})`);
    if(!lodash.isObject(msg)) throw new BilligtMQError('msg must be an object');

    const msgFile = `${Date.now()}.${this.name}.${shortid.generate()}.json`;
    console.log('msgFile', msgFile);
    const workingPath = `${topic}/.incoming/working/${msgFile}`;
    return this.fs.writeFile(workingPath, JSON.stringify(msg))
    //.then(() => {
      // actually might skip this step
      //const workingPath = `${topic}/.incoming/working/${msgFile}`;
      //return this.fs.moveFile(workingPath, targetPath);
    //})
    .then(() => {
      console.log('before getSubdirs');
      return this.fs.getSubdirs(topic);
    })
    .then((listeners) => {
      const ps = [];
      lodash.forEach(listeners, (l) => {
        if(l === '.incoming') return;
        const subscriberWorking = `${topic}/${l}/working/${msgFile}`;
        const p = this.fs.copyFile(workingPath, subscriberWorking)
        .then(() => {
          const subscriberTarget = `${topic}/${l}/target/${msgFile}`;
          return this.fs.moveFile(subscriberWorking, subscriberTarget);
        });
        ps.push(p);
      });
      return Promise.all(ps);
    })
    .then(() => {
      // delivered to all subscribers; move action to processed
      const processedPath = `${topic}/.incoming/processed/${msgFile}`;
      return this.fs.moveFile(workingPath, processedPath);
    })
    .then(() => msgFile);
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
  .then(() => createTopicSubscriberDirs(bmq, topic));
}

function createTopicSubscriberDirs(bmq, topic) {
  return bmq.fs.createDirIfNotExists(topic)
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.${bmq.name}`))
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.${bmq.name}/working`))
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.${bmq.name}/target`))
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.${bmq.name}/processing`))
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.${bmq.name}/processed`))
  .then(() => bmq.fs.createDirIfNotExists(`${topic}/.${bmq.name}/error`));
}

function handleListen(bmq, topic, event, file) {
  console.log(`handleListen: event=${event}, filename=${file}`);
  const targetPath = `${topic}/.${bmq.name}/target/${file}`;
  return bmq.fs.readFile(targetPath)
  .then((contents) => {
    const obj = JSON.parse(contents);
    bmq.emit(topic, obj);
    const processedPath = `${topic}/.${bmq.name}/processed/${file}`;
    return bmq.fs.moveFile(targetPath, processedPath);
  });
}

module.exports = BilligtMQ;
