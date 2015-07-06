/**
 * This class is responsible for executing alert policies, according to the rules specified
 * in the policies
 */
NotificationService.AlertPoliciesExecutor = {
  _slackClient: null,

  _timeoutHandlers: {},

  startup() {
    let self = this;

    self._connectSlackClient(function() {
      console.log("[NotificationService.AlertPoliciesExecutor] slack connected");
      NotificationService.AlertPolicies.find({}).observe({
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
    });
  },

  /**
   * Connect slack client to send notification to
   */
  _connectSlackClient(callback) {
    let token = Meteor.settings.notificationService.slack.token;
    let channelName = Meteor.settings.notificationService.slack.channelName;
    this._slackClient = _.extend({}, NotificationService.SlackTeamClient);
    this._slackClient.init(token, channelName, callback);
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
    _.each(alertPolicy.schedules, function(schedule, index) {
      console.log("[NotificationService.AlertPolicyExecutor] cancel schedule: ", JSON.stringify(schedule));
      Meteor.clearTimeout(self._timeoutHandlers[alertPolicy._id][index]);
    });

    self._slackClient.sendResponded({
      dChannelId: alertPolicy.channelId
    });
  }
}
