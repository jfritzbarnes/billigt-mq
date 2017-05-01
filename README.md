> billigt-mq: cheap message queue / topic service

Goal: cheap pubsub protocol for small projects that allow interoperation of
disparate components; often not operating continuously.

Design: uses a shared file system (DropBox) to accomplish the message queue / topic
between components.

Directories:
* root service
  * [topic 1]
    * .incoming
      * working: used by publisher to prep a message
      * target: used once message is ready for action
      * processing: used by consumer when they begin work
      * processed: used by consumer when they finish
      * error: used by consumer when job cannot be completed
    * .subscriber1
      * working: used by publisher to prep a message
      * target: used once message is ready for action
      * processing: used by consumer when they begin work
      * processed: used by consumer when they finish
      * error: used by consumer when job cannot be completed

Message filename structure: `[timestamp].[sender].[id].json`

BilligtMQ Options Supported:
* FS: can use local filesystem or Dropbox; parameters below are related to fs
  * fs: optional, defaults to Dropbox
  * dropboxToken: required, used to store files on dropbox
* name: an instance name for this listener; should be unique
* topics: a set of topics that should be listened on; these will be created if they don't exist
* not implemented yet:
  * senderReceives: optional, defaults to false. If this is true, messages the sender sends will also be sent to the sender.
  * retainProcessing: optional, defaults to true. If true, a copy of all handled messages are stored in the [topic]/[receiver]/processed directory.
