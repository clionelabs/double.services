/**
 * Associate a assistant account in double.dashboard with a slack user account in clionelab's slack
 */
NotificationService.SlackUsers = new Meteor.Collection("d-services-notification-slackusers");

NotificationService.SlackUsers.allow({
  insert(userId) {
    return Users.isAdmin(userId);
  },
  update(userId) {
    return Users.isAdmin(userId);
  },
  remove(userId) {
    return Users.isAdmin(userId);
  }
});

_.extend(NotificationService.SlackUsers, {

  /**
   * Create if a new user if not exists. or update the information if exists
   *
   * @param {Object} slackUser User Object of Slack client
   */
  upsertUser(slackUser) {
    let selector = {
      slackId: slackUser.id
    };
    let modifiers = {
      $set: {
        slackId: slackUser.id,
        slackName: slackUser.name
      }
    };
    NotificationService.SlackUsers.upsert(selector, modifiers);
  },

  assignAssistant(slackUserId, assistantId, callback) {
    NotificationService.SlackUsers.update(slackUserId, {$set: {assistantId: assistantId}}, callback);
  },

  unassignAssistant(slackUserId, callback) {
    NotificationService.SlackUsers.update(slackUserId, {$unset: {assistantId: 1}}, callback);
  }
});

