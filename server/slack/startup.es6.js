_.extend(SlackService, {
  startup: function() {
    SlackService.Teams.find().observe({
      added: function(team) {
        let slackClient = _.extend({}, SlackService.TeamClient);
        slackClient.init(team.authToken);

        let slackMonitor = _.extend({}, SlackService.TeamClientMonitor);
        slackMonitor.init(team, slackClient);
      },
      removed: function(team) {
        // TODO handle
      }
    });
  }
});
