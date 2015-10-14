/**
 * This class is responsible for executing alert policies, according to the rules specified
 * in the policies
 */
NotificationService.AlertPoliciesExecutor = {
  _slackClient: null,

  _observeHandler: null,

  _timeoutHandlers: {},

  startup() {
    let self = this;
    self._slackClient = _.extend({}, NotificationService.SlackTeamClient);
    self._slackClient.updateUsers();

    if (self._observeHandler) {
      self._observeHandler.stop();
    }
    self._observeHandler = NotificationService.AlertPolicies.find({}).observe({
      executor: self,
      added(doc) {
        console.log("[NotificationService.AlertPoliciesExecutor] new policy: ", doc);
        this.executor._startAlertPolicy(doc);
      },
      removed(doc) {
        console.log("[NotificationService.AlertPoliciesExecutor] removed policy: ", doc);
        this.executor._endAlertPolicy(doc);
      }
    });
  },

  /**
   * Schedule jobs for an alert policy
   */
  _startAlertPolicy(alertPolicy) {
    let self = this;
    self._timeoutHandlers[alertPolicy._id] = {};
    _.each(alertPolicy.schedules, function(schedule, index) {
      let delay = moment(schedule.notifyAt).diff(moment().valueOf(), 'ms');
      console.log("[NotificationService.AlertPolicyExecutor] scheduling in: ", delay, JSON.stringify(schedule));
      if (delay < 0) return;

      self._timeoutHandlers[alertPolicy._id][index] = Meteor.setTimeout(Meteor.bindEnvironment(function() {
        console.log("executing schedule: ", schedule);

        self._slackClient.sendNotification({
          dChannelId: alertPolicy.channelId,
          alertTarget: schedule.target
        });
      }), delay);
    });
  },

  /**
   * Remove jobs for an alert policy
   */
  _endAlertPolicy(alertPolicy) {
    let self = this;
    let hasAlerted = false;
    _.each(alertPolicy.schedules, function(schedule, index) {
      let delay = moment(schedule.notifyAt).diff(moment().valueOf(), 'ms');
      if (delay < 0) {
        hasAlerted = true;
      }

      console.log("[NotificationService.AlertPolicyExecutor] cancel schedule: ", JSON.stringify(schedule));
      Meteor.clearTimeout(self._timeoutHandlers[alertPolicy._id][index]);
    });

    if (hasAlerted) {
      self._slackClient.sendResponded({
        dChannelId: alertPolicy.channelId
      });
    }
  }
}
