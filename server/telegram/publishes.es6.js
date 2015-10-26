Meteor.publish('telegramBots', function() {
  if (!Users.isAdmin(this.userId)) return [];
  return [
    TelegramService.Bots.find()
  ]
});
