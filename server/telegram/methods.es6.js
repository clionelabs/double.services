Meteor.methods({
  addTelegramAuthToken: function(authToken) {
    TelegramService.Bots.insert({token: authToken});
  }
});

