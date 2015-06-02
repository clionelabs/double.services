SlackService.Teams = new Meteor.Collection("d-services-slack-teams", {
  transform: (doc) => {
    return _.extend(doc, SlackService.Team);
  }
});

SlackService.Team = {
  channels: function() {
    return D.Channels.find({category: D.Channels.Categories.SLACK, 'extra.teamId': this.teamId});
  }
}
