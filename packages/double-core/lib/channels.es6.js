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
  lastMessageTimestamp() {
    return this.lastMessage? this.lastMessage.timestamp: 0;
  },
  isNotReplied() {
    let lastMessage = this.lastMessage;
    if (!lastMessage) return false;
    let isReplied = lastMessage.inOut === D.Messages.InOut.OUT && !lastMessage.isAutoReply;
    return !isReplied;
  },
  isOnline() {
    let isChannelOnline = false;
    if (this.category === D.Channels.Categories.SLACK) {
      isChannelOnline |= _.reduce(this.extra.members, function(memo, member) {
        return memo | member.presence === 'active';
      }, false);
    }
    return isChannelOnline;
  }
}
