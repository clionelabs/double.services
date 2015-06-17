NotificationService.AlertPolicy = {
  channelHandlers: {},

  startChannelAlert(channelId) {
    let job = new Job(NotificationService.AlertJobs, 'slack', {
      channelId: channelId
    });
    job.priority('normal').delay(10 * 1000).save();

    /*
    console.log("[NotificationService.AlertPolicy] startChannelAlert: ", channelId);
    this.endChannelAlert(channelId);
    let handler = Meteor.setInterval(function() {
      console.log("alerting channel: ", channelId);
    }, 10000);
    this.channelHandlers[channelId] = handler;
    */
  },

  endChannelAlert(channelId) {
    /*
    console.log("[NotificationService.AlertPolicy] endChannelAlert: ", channelId);
    let handler = this.channelHandlers[channelId];
    if (!handler) return;
    Meteor.clearInterval(handler);
    */
  }
}

