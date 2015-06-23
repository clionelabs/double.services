Meteor.publish('assistants', function() {
  if (!D.Users.isAdmin(this.userId)) return [];
  return [
    D.Users.findAssistants()
  ]
});
