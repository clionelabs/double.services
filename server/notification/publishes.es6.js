Meteor.publish('notificationChannels', function() {
  if (!Users.isAdmin(this.userId)) return [];
  return [
    D.Channels.find()
  ]
});

Meteor.publish('notificationSlackUsers', function() {
  if (!Users.isAdmin(this.userId)) return [];
  return [
    NotificationService.SlackUsers.find()
  ]
});
