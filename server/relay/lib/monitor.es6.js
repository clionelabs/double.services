RelayService.Monitor = {
  _observeHandler: null,

  startMonitoring() {
    this._startProcessingMessages();
  },

  /*
   * @param {D.Message} message
   */
  relayMessage(message) {
    let self = this;

    let relayChannelName = Meteor.settings.relayService.slack.channelName;

    let channel = D.Channels.findOne(message.channelId);
    let channelName = '';
    if (channel.category === D.Channels.Categories.SLACK) {
      channelName = `${channel.extra.channel.name} [${channel.extra.channel.id.charAt(0)}]`;
    } else if (channel.category === D.Channels.Categories.TELEGRAM) {
      channelName = `${channel.extra.first_name} [T]`;
    }

    let icon_emoji = message.inOut === D.Messages.InOut.OUT? ':troll:': ':alien:';
    let userName = `${message.userName} - ${channelName}`;
    let options = {
      text: message.content,
      username: userName,
      icon_emoji: icon_emoji
    };

    SlackLog.log(relayChannelName, options);
  },

  _startProcessingMessages() {
    let self = this;

    // Ignore initial to avoid flooding
    let current = moment().valueOf();
    let selector = {
      inOut: {$in: [D.Messages.InOut.IN, D.Messages.InOut.OUT]},
      timestamp: {$gt: current},
      'relay.processed': {$ne: true}
    };

    if (self._observeHandler) {
      self._observeHandler.stop();
    }
    self._observeHandler = D.Messages.find(selector, {sort: {timestamp: 1}}).observe({
      monitor: self,
      added(message) {
        let channel = D.Channels.findOne(message.channelId);

        // Ignore spammed channels
        if (!channel.isSpam) {
          this.monitor.relayMessage(message);
        }
        D.Messages.update(message._id, {$set: {'relay.processed': true}});
      }
    });
  }
}
