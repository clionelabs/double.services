Meteor.publish('slackTeams', function() {
  if (!this.userId) return [];
  return [
    SlackService.Teams.find()
  ]
});

Meteor.publish('slackChannels', function() {
  if (!this.userId) return [];
  return [
    D.Channels.find({category: D.Channels.Categories.SLACK})
  ]
});
