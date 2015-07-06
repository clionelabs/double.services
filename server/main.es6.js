var setupAdmin = function() {
  if (Meteor.settings.adminAccount) {
    let email = Meteor.settings.adminAccount.email;
    let password = Meteor.settings.adminAccount.password;
    if (!Meteor.users.findOne({emails: {$elemMatch: {address: email}}})) {
      Users.createAdmin({
        email: email,
        password: password
      });
    }
  }
}

Meteor.startup(function () {
  setupAdmin();

  if (Meteor.settings.enabledServices) {
    if (Meteor.settings.enabledServices.slack) {
      SlackService.startup();
    }
    if (Meteor.settings.enabledServices.notification) {
      NotificationService.startup();
    }
    if (Meteor.settings.enabledServices.relay) {
      RelayService.startup();
    }
  }
});
