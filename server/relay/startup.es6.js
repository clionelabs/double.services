_.extend(RelayService, {
  startup: function() {
    if (Meteor.settings.relayService) {
      let monitor = _.extend({}, RelayService.Monitor);
      monitor.startMonitoring();
    }
  }
});

