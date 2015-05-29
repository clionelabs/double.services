Meteor.publish('slackTeams', function() {
  if (!this.userId) return [];
  return [
    SlackService.Teams.find()
  ]
});
