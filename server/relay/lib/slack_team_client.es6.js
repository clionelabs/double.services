// API client for a slack team
RelayService.SlackTeamClient = {
  client: null,

  _relayChannelName: null,
  _relayChannel: null,

  _initCallback: null,

  /*
   * Initialize and start slack RTC client, given the authToken
   * @param {String} authToken
   */
  init(authToken, relayChannelName, callback) {
    let self = this;
    self._relayChannelName = relayChannelName;
    self.client = new Slack(authToken, true, true); // autoReconnect = true, autoMark = true
    self.client.on('open', Meteor.bindEnvironment(() => {self._clientOnOpen()}));
    self.client.on('error', Meteor.bindEnvironment((error) => {self._clientOnError(error)}));
    self.client.login();
    self._initCallback = callback;
  },

  /*
   * @param {DMessage} messaage
   */
  relayMessage(message) {
    let self = this;

    let channel = D.Channels.findOne(message.channelId);
    let channelName = '';
    if (channel.category === D.Channels.Categories.SLACK) {
      channelName = `${channel.extra.channel.name} [${channel.extra.channel.id.charAt(0)}]`;
    }

    let icon_emoji = message.inOut === D.Messages.InOut.OUT? ':troll:': ':alien:';
    let userName = `${message.userName} - ${channelName}`;
    let messageData = {
      channel: self._relayChannel.id,
      text: message.content,
      username: userName,
      icon_emoji: icon_emoji
    };
    self._postMessage(messageData);
  },

  /**
   * Callback when RTC client is connected
   */
  _clientOnOpen() {
    console.log('[RelayService.TeamClient] clientOnOpen: ', this.client.team.name);
    let self = this;
    _.each(_.values(self.client.channels), function(channel) {
      if (channel.name === self._relayChannelName) {
        self._relayChannel = channel;
      }
    });
    if (self._initCallback) {
      self._initCallback();
    }
  },

  /**
   * Callback when RTC client received error
   */
  _clientOnError(error) {
    console.log('[RelayService.TeamClient] clientOnError: ', error);
  },

  _postMessage(messageData) {
    this.client._apiCall('chat.postMessage', messageData);
  }
}
