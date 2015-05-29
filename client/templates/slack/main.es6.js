Template.slackMain.rendered = function() {
  let team = SlackService.Teams.findOne();
  if (team) {
    Session.set("mainTabActiveTeamId", team.teamId);
  }
};

Template.slackMain.destroyed = function() {
  Session.set("mainTabActiveTeamId", null);
};

Template.slackMain.events({
  'click .team-tab': function(event) {
    Session.set("mainTabActiveTeamId", this.teamId);
  },

  'click .team-setup-tab': function(event) {
    Session.set("mainTabActiveTeamId", null);
  }
});

Template.slackMain.helpers({
  isActiveTeam: function(team) {
    return Session.get("mainTabActiveTeamId") === team.teamId;
  },

  isSetup: function() {
    return !Session.get("mainTabActiveTeamId");
  },

  activeTeam: function() {
    let teamId = Session.get("mainTabActiveTeamId");
    return SlackService.Teams.findOne({teamId: teamId});
  }
});
