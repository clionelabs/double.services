// API client for a slack team
NotificationService.SlackTeamClient = {

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
      // channel: this._notifyChannel.id,
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
      // channel: this._notifyChannel.id,
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
      // channel: this._notifyChannel.id,
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

  _postMessage(messageData) {
    let notifyChannelName = Meteor.settings.notificationService.slack.channelName;
    SlackLog.log(notifyChannelName, messageData);
  },

  /**
   * Insert clionelab's slack team members, to allow association with dashboard assistant
   */
  updateUsers() {
    let self = this;
    let data = SlackLog._api('users.list', {});
    let members = data.members;
    _.each(members, function(user) {
      NotificationService.SlackUsers.upsertUser(user);
    });
  }
}
