Router.configure({
  layoutTemplate: 'layout'
});

Router.route("login", {
  path: '/login',
  onBeforeAction() {
    if (Meteor.user()) {
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
    if (!Meteor.user()) {
      Router.go("login");
    }
    this.next();
  },
  waitOn() {
    return Meteor.subscribe("slackTeams");
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
