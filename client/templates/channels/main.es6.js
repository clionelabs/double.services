Template.channelsMain.helpers({
  channels() {
    return D.Channels.find().map(function(channel) {
      let type;
      let name;
      if (channel.category === D.Channels.Categories.SLACK) {
        type = `slack - ${channel.extra.channel.type}`
        name = channel.extra.channel.name;
      } else if (channel.category === D.Channels.Categories.TELEGRAM) {
        type = 'telegram';
        name = `${channel.extra.first_name} ${channel.extra.last_name}`;
      }
      extension = {
        type: type,
        name: name
      }
      return _.extend(channel, extension);
    });
  }
});
