/**
 * @property {String} category Category of channels, e.g. SLACK, SMS, EMAIL
 * @property {String} meta Meta data to identify the channel; Different formats for different categories
 * @property {String} customerId
 * @property {Boolean} isSpam
 */
D.Channels = new Meteor.Collection("d-channels", {
  transform: (doc) => {
    return _.extend(doc, D.Channel);
  }
});

_.extend(D.Channels, {
  assignChannelToCustomer(channelId, customerId) {
    D.Channels.update(channelId, {$set: {customerId: customerId, isSpam: false}});
  },
  unassignChannel(channelId) {
    D.Channels.update(channelId, {$unset: {customerId: ''}, $set: {isSpam: false}});
  },
  assignChannelToSpam(channelId) {
    D.Channels.update(channelId, {$unset: {customerId: ''}, $set: {isSpam: true}});
  }
});

D.Channels.allow({
  insert(userId) {
    return Users.isAdmin(userId) || Users.isAssistant(userId);
  },
  update(userId) {
    return Users.isAdmin(userId) || Users.isAssistant(userId);
  },
  remove(userId) {
    return Users.isAdmin(userId) || Users.isAssistant(userId);
  }
});

D.Channels.Categories = {
  SLACK: 'SLACK'
}

D.Channel = {
  messages(options = {}) {
    return D.Messages.find({channelId: this._id}, options);
  },
  lastMessage() {
    return D.Messages.findOne({channelId: this._id}, {sort: {timestamp: -1}});
  },
  lastMessageTimestamp() {
    return this.lastMessage() ? this.lastMessage().timestamp : 0;
  },
  isNotReplied() {
    let lastMessage = this.lastMessage();
    return lastMessage && lastMessage.inOut === D.Messages.InOut.IN;
  }
}
