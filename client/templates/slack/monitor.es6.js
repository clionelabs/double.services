Template.slackMonitor.helpers({
  teams() {
    return SlackService.Teams.find();
  }
});

Template.slackMonitorTeam.helpers({
  isWSGood() {
    return moment().diff(moment(this.monitoring.wsStatus.lastPong), 's') < 30;
  },

  isChannelMessagesGood() {
    let good = _.reduce(_.values(this.monitoring.channelStatuses), function(memo, channelStatus) {
      return memo && channelStatus.isLatestMessageMatched;
    }, true);
    return good;
  },

  isChannelOutingGood() {
    let good = _.reduce(_.values(this.monitoring.channelStatuses), function(memo, channelStatus) {
      return memo && channelStatus.hasNoOuting;
    }, true);
    return good;
  },

  wsCheckedAt() {
    return moment(this.monitoring.lastWSCheckedAt).format("HH:mm:ss");
  },

  channelsCheckedAt() {
    return moment(this.monitoring.lastChannelsCheckedAt).format("HH:mm:ss");
  }
});

