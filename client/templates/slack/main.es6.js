Template.slackMain.rendered = function() {
  let team = SlackService.Teams.findOne();
  if (team) {
    Session.set("slackMainActiveTeamId", team.teamId);
  }
};

Template.slackMain.destroyed = function() {
  Session.set("slackMainActiveTeamId", null);
};

Template.slackMain.events({
  'click .team-tab': function(event) {
    Session.set("slackMainActiveTeamId", this.teamId);
  },

  'click .team-setup-tab': function(event) {
    Session.set("slackMainActiveTeamId", null);
  }
});

Template.slackMain.helpers({
  isActiveTeam: function(team) {
    return Session.get("slackMainActiveTeamId") === team.teamId;
  },

  isSetup: function() {
    return !Session.get("slackMainActiveTeamId");
  },

  activeTeam: function() {
    let teamId = Session.get("slackMainActiveTeamId");
    return SlackService.Teams.findOne({teamId: teamId});
  }
});
