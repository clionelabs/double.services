/**
 * @property {String} category Category of channels, e.g. SLACK, SMS, EMAIL
 * @property {String} meta Meta data to identify the channel; Different formats for different categories
 * @property {String} customerId
 */
D.Channels = new Meteor.Collection("d-channels", {
  transform: (doc) => {
    return _.extend(doc, D.Channel);
  }
});

_.extend(D.Channels, {
  assignChannelToCustomer(channelId, customerId) {
    D.Channels.update(channelId, {$set: {customerId: customerId}});
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
  messages() {
    return D.Messages.find({channelId: this._id});
  }
}
