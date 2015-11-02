Router.configure({
  layoutTemplate: 'layout'
});

Router.route("login", {
  path: '/login',
  onBeforeAction() {
    if (Users.isAdmin(Meteor.userId())) {
      Router.go("slack");
    }
    this.next();
  },
  action() {
    this.render("login");
  }
});

Router.route("home", {
  path: '/',
  action() {
    Router.go("slack");
  }
});


Router.route("admin", {
  path: 'admin',
  onBeforeAction() {
    if (!Users.isAdmin(Meteor.userId())) {
      Router.go("login");
    }
    this.next();
  },
  waitOn() {
    return [
      Meteor.subscribe("slackTeams"),
      Meteor.subscribe("slackChannels"),
      Meteor.subscribe("telegramBots"),
      Meteor.subscribe("notificationChannels"),
      Meteor.subscribe("notificationSlackUsers"),
      Meteor.subscribe("assistants")
    ]
  },
  data() {
    return {
      teams: SlackService.Teams.find()
    }
  },
  action() {
    this.render('adminMain');
  }
});

// legacy path -> redirect to admin
Router.route("/slack", {
  name: 'slack',
  action() {
    Router.go("admin");
  }
});
