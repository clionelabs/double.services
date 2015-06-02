Template.login.events({
  'submit #login-form': function(event) {
    event.preventDefault();
    let form = event.target;
    let email = form.email.value;
    let password = form.password.value;
    Meteor.loginWithPassword(email, password, function(error){
      if (error) {
        Notifications.error(error.error, error.reason);
      }
    });
  }
});
