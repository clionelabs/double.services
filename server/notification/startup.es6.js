_.extend(NotificationService, {
  startup: function() {
    if (Meteor.settings.notificationService) {
      let monitor = _.extend({}, NotificationService.Monitor);
      monitor.startMonitoringChannels();
      NotificationService.AlertJobs.startJobServer();
    }
    if (Meteor.settings.notificationService && Meteor.settings.notificationService.slack) {
      let token = Meteor.settings.notificationService.slack.token;
      let channelName = Meteor.settings.notificationService.slack.channelName;
      let client = _.extend({}, NotificationService.SlackTeamClient);
      client.init(token);
    }
  }
});
