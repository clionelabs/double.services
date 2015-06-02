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

  SlackService.startup();
});
