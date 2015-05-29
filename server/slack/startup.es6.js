_.extend(SlackService, {
  startup: function() {
    SlackService.Teams.find().observe({
      added: function(team) {
        let client = _.extend({}, SlackService.TeamClient);
        client.init(team.authToken);
      },
      removed: function(team) {
      }
    });
  }
});
