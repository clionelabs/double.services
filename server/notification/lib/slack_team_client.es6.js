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

    let messageData;
    if (data.alertTarget === NotificationService.AlertPolicies.AlertTargets.GLOBAL) {
      messageData = this._globalNotifyMessage(customer);
    } else if (data.alertTarget === NotificationService.AlertPolicies.AlertTargets.INDIVIDUAL) {
      messageData = this._individualNotifyMessage(customer, assistant);
    }
    this._postMessage(messageData);
  },

  sendResponded(data) {
    let dChannelId = data.dChannelId;
    let dChannel = D.Channels.findOne(dChannelId);
    let customer = Users.findOneCustomer(dChannel.customerId);

    let messageData = this._respondedMessage(customer);
    this._postMessage(messageData);
  },

  _respondedMessage(customer) {
    let clientName = customer.displayName();
    let message = `Gotcha - ${clientName}`;
    return {
      channel: this._notifyChannel.id,
      text: message,
      username: clientName,
      icon_emoji: ':smirk:'
    }
  },

  _globalNotifyMessage(customer) {
    let hash = this._globalHash();
    let clientName = customer.displayName();
    let message = `${hash}: I am ${clientName}. I am still waiting~~`;

    return {
      channel: this._notifyChannel.id,
      text: message,
      username: clientName,
      icon_emoji: ':sob:'
    }
  },

  _individualNotifyMessage(customer, assistant) {
    let hash = this._individualHash(assistant);
    let clientName = customer.displayName();
    let message = `Hey ${hash}, I am ${clientName}. I am waiting for your reply~~`;

    return {
      channel: this._notifyChannel.id,
      text: message,
      username: clientName,
      icon_emoji: ':kissing_heart:'
    }
  },

  _globalHash() {
    return "<!channel>";
  },

  _individualHash(assistant) {
    if (!assistant) return '';
    let slackUser = NotificationService.SlackUsers.findOne({assistantId: assistant._id});
    if (!slackUser) return '';
    return `<@${slackUser.slackId}|${slackUser.slackName}>`;
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

  _postMessage(messageData) {
    this.client._apiCall('chat.postMessage', messageData);
  },

  _updateUsers() {
    let self = this;
    _.each(self.client.users, function(user) {
      NotificationService.SlackUsers.upsertUser(user);
    });
  }
}
