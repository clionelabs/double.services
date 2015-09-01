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

Router.route("/slack", {
  name: 'slack',
  onBeforeAction() {
    if (!Users.isAdmin(Meteor.userId())) {
      Router.go("login");
    }
    this.next();
  },
  waitOn() {
    return [
      Meteor.subscribe("slackTeams"),
      Meteor.subscribe("slackChannels")
    ]
  },
  data() {
    return {
      teams: SlackService.Teams.find()
    }
  },
  action() {
    this.render('slackMain');
  }
});

Router.route("/notification", {
  name: 'notification',
  onBeforeAction() {
    if (!Users.isAdmin(Meteor.userId())) {
      Router.go("login");
    }
    this.next();
  },
  waitOn() {
    return [
      Meteor.subscribe("notificationChannels"),
      Meteor.subscribe("notificationSlackUsers"),
      Meteor.subscribe("assistants")
    ]
  },
  action() {
    this.render('notificationMain');
  }
});

Router.route("/monitor", {
  name: 'monitor',
  onBeforeAction() {
    if (!Users.isAdmin(Meteor.userId())) {
      Router.go("login");
    }
    this.next();
  },
  waitOn() {
    return [
      Meteor.subscribe("slackTeams")
    ]
  },
  action() {
    this.render('monitorMain');
  }
});
