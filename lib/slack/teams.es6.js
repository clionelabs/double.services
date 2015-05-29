SlackService.Teams = new Meteor.Collection("d-services-slack-teams", {
  transform: (doc) => {
    return _.extend(doc, SlackService.Team);
  }
});

SlackService.Team = {
}
