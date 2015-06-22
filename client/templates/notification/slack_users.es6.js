Template.notificationSlackUsers.helpers({
  slackUsers() {
    return NotificationService.SlackUsers.find();
  }
});

Template.notificationSlackUserRow.helpers({
  hasAssignedAssistant: function() {
    return !!this.assistantId;
  },

  assignedAssistantName: function() {
    let emptyUser = {
      displayName() {
        return '--';
      }
    }
    let user = D.Users.findOne(this.assistantId) || emptyUser;
    return user.displayName();
  },

  availableAssistants: function() {
    let slackUserId = this._id;
    return _.map(D.Users.findAssistants().fetch(), function(assistant) {
      return _.extend(assistant, { slackUserId: slackUserId });
    });
  }
});


let _slackUserRowUpdateCallback = function(error) {
  if (error) {
    Notifications.error("updated failed", "");
  } else {
    Notifications.success("updated successful", "");
  }
};

Template.notificationSlackUserRow.events({
  "click .unassign-assistant": function() {
    let slackUserId = this._id;
    NotificationService.SlackUsers.unassignAssistant(slackUserId, _slackUserRowUpdateCallback);
  },
  "click .assign-assistant": function(event) {
    let slackUserId = this.slackUserId;
    let assistantId = this._id;
    NotificationService.SlackUsers.assignAssistant(slackUserId, assistantId, _slackUserRowUpdateCallback);
  }
});
