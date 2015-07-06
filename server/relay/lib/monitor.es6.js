RelayService.Monitor = {
  _slackClient: null,
  _observeHandler: null,

  startMonitoring() {
    let self = this;
    self._connectSlackClient(function() {
      console.log("[RelayService.Monitor] slack connected");
      self._startProcessingMessages();
    });
  },

  /*
   * @param {D.Message} message
   */
  relayMessage(message) {
    this._slackClient.relayMessage(message);
  },

  /**
   * Connect slack client to send notification to
   */
  _connectSlackClient(callback) {
    let token = Meteor.settings.relayService.slack.token;
    let channelName = Meteor.settings.relayService.slack.channelName;
    this._slackClient = _.extend({}, RelayService.SlackTeamClient);
    this._slackClient.init(token, channelName, callback);
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
        // ONLY consider channels with assigned customers
        if (channel.customerId) {
          this.monitor.relayMessage(message);
        }
        D.Messages.update(message._id, {$set: {'relay.processed': true}});
      }
    });
  }
}
