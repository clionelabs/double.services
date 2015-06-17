NotificationService.Channel = {
  findOne(selector) {
    let channel = D.Channels.findOne(selector, {transform: function(doc) {
      _.extend(doc, D.Channel);
      return new NotificationService.ChannelStateMachine(doc);
    }});
    return channel;
  }
}

