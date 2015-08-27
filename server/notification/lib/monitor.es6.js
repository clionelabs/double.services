NotificationService.Monitor = {
  startMonitoringChannels() {
    // this._resetAll();
    this._startProcessingMessages();
    this._startAlertPoliciesExecutor();
  },

  _resetAll() {
    D.Messages.update({}, {$unset: {'notification': 1}}, {multi: true});
    D.Channels.update({}, {$unset: {'notification': 1}}, {multi: true});
    NotificationService.AlertPolicies.remove({});
  },

  _startProcessingMessages() {
    let selector = {
      inOut: {$in: [D.Messages.InOut.IN, D.Messages.InOut.OUT]},
      'notification.processed': {$ne: true}
    };

    D.Messages.find(selector, {sort: {timestamp: 1}}).observe({
      added(message) {
        let channel = NotificationService.Channel.findOne(message.channelId);
        // console.log("processing message: ", JSON.stringify(message));

        // ONLY consider channels with assigned customers
        if (channel.customerId) {
          if (message.inOut === D.Messages.InOut.IN) {
            channel.inbound();
          } else if (message.inOut === D.Messages.InOut.OUT) {
            // Ignore out-of-office auto-reply message
            if (!message.isAutoReply) {
              channel.outbound();
            }
          }
        }
        D.Messages.update(message._id, {$set: {'notification.processed': true}});
      }
    });
  },

  _startAlertPoliciesExecutor() {
    NotificationService.AlertPoliciesExecutor.startup();
  }
}
