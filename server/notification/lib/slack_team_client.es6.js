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
    let dChannelId = data.dChannelId;
    let dChannel = D.Channels.findOne(dChannelId);
    let customer = Users.findOneCustomer(dChannel.customerId);
    let assistant = customer.assistant();
    let contentPrefix = '';

    if (data.alertTarget === NotificationService.AlertPolicies.AlertTargets.GLOBAL) {
      contentPrefix = "<!channel>: ";
    } else if (data.alertTarget === NotificationService.AlertPolicies.AlertTargets.INDIVIDUAL) {
      if (assistant) {
        let slackUser = NotificationService.SlackUsers.findOne({assistantId: assistant._id});
        if (slackUser) {
          contentPrefix = `<@${slackUser.slackId}|${slackUser.slackName}>: `;
        }
      }
    }
    let content = `Hey, You have a new messaging coming from ${customer.profile.firstname} through channel - ${dChannel.extra.channel.name}`;
    content = contentPrefix + content;
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

    self._updateUsers();

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

  _updateUsers() {
    let self = this;
    _.each(self.client.users, function(user) {
      NotificationService.SlackUsers.upsertUser(user);
    });
  }
}
