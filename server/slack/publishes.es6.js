Meteor.publish('slackTeams', function() {
  if (!Users.isAdmin(this.userId)) return [];
  return [
    SlackService.Teams.find()
  ]
});

Meteor.publish('slackChannels', function() {
  if (!Users.isAdmin(this.userId)) return [];
  return [
    D.Channels.find({category: D.Channels.Categories.SLACK})
  ]
});
