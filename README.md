billigt-mq: cheap message queue / topic service

Goal: cheap pubsub protocol for small projects that allow interoperation of
disparate components; often not operating continuously.

Design: uses a shared file system (DropBox) to accomplish the message queue / topic
between components.

Directories:
* working: used by publisher to prep a message
* target: used once message is ready for action
* processing: used by consumer when they begin work
* processed: used by consumer when they finish
* error: used by consumer when job cannot be completed
