Template.telegramBotSetup.events({
  "submit #add-bot-form": function(event) {
    event.preventDefault();

    let form = event.target;
    let authToken = form.authToken.value;
    Meteor.call('addTelegramAuthToken', authToken, function(error) {
      if (error) {
        Notifications.error(error.error, error.reason);
        jQuery('html,body').animate({scrollTop:0},0);
      } else {
        Notifications.success("Successful", "Bot added");
        form.authToken.value = '';
      }
    });
  }
});

