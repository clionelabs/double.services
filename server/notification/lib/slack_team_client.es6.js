// API client for a slack team
NotificationService.SlackTeamClient = {
  client: null,

  _notifyChannelName: null,
  _notifyChannel: null,

  _initCallback: null,

  /*
   * Initialize and start slack RTC client, given the authToken
   * @param {String} authToken
   */
  init(authToken, notifyChannelName, callback) {
    let self = this;
    self._notifyChannelName = notifyChannelName;
    self.client = new Slack(authToken, true, true); // autoReconnect = true, autoMark = true
    self.client.on('open', Meteor.bindEnvironment(() => {self._clientOnOpen()}));
    self.client.on('error', Meteor.bindEnvironment((error) => {self._clientOnError(error)}));
    self.client.login();
    self._initCallback = callback;
  },

  /**
   * Send notification message to slack
   */
  sendNotification(data) {
    console.log("data: ", data);
    let dChannelId = data.dChannelId;
    let dChannel = D.Channels.findOne(dChannelId);
    let customer = Meteor.users.findOne(dChannel.customerId);
    let content = `Hey, You have a new messaging coming from ${customer.profile.firstname} through channel - ${dChannel.extra.channel.name}`;
    // TODO: notify double's DM if data.alertTarget === 'Individual'
    this._notifyChannel.send(content);
  },

  /**
   * Callback when RTC client is connected
   */
  _clientOnOpen() {
    console.log('[NotificationService.TeamClient] clientOnOpen: ', this.client.team.name);
    let self = this;
    _.each(_.values(self.client.channels), function(channel) {
      if (channel.name === self._notifyChannelName) {
        self._notifyChannel = channel;
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
    console.log('[NotificationService.TeamClient] clientOnError: ', error);
  },
}
