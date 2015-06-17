Meteor.publish('notificationChannels', function() {
  if (!Users.isAdmin(this.userId)) return [];
  return [
    D.Channels.find()
  ]
});
