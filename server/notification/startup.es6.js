_.extend(NotificationService, {
  startup: function() {
    if (Meteor.settings.notificationService) {
      let monitor = _.extend({}, NotificationService.Monitor);
      monitor.startMonitoringChannels();
    }
  }
});
