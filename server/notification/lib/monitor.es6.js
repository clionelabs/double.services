NotificationService.Monitor = {
  startMonitoringChannels() {
    this._resetAll();
    this._startProcessingMessages();
  },

  _resetAll() {
    D.Messages.update({}, {$unset: {'notification': 1}}, {multi: true});
    D.Channels.update({}, {$unset: {'notification': 1}}, {multi: true});
    NotificationService.AlertJobs.remove({});
  },

  _startProcessingMessages() {
    let selector = {
      inOut: {$in: [D.Messages.InOut.IN, D.Messages.InOut.OUT]},
      'notification.processed': {$ne: true}
    };

    D.Messages.find(selector, {sort: {timestamp: -1}}).observe({
      added(message) {
        let channel = NotificationService.Channel.findOne(message.channelId);
        console.log("[NotificationService.Monitor] processing message: ", JSON.stringify(message), JSON.stringify(channel));
        if (message.inOut === D.Messages.InOut.IN) {
          channel.inbound();
        } else if (message.inOut === D.Messages.InOut.OUT) {
          channel.outbound();
        }
        D.Messages.update(message._id, {$set: {'notification.processed': true}});
      }
    });
  }
}
