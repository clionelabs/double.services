/**
 * Alert policy for pending-reply channels
 *
 * Current alert policy:
 *   - Upon entering `Pending Reply`, wait for X seconds for double to reply. Otherwise, fire up
 *   an alert message to the double slack DM
 *   - Afterwards, it the channel stays "Pending Reply', fire up an alert messages to the global slack channel after Y seconds
 *
 * @property {String} channelId
 * @property {Object[]} schedules
 */
NotificationService.AlertPolicies = new Meteor.Collection("d-services-notification-alertpolicies");

_.extend(NotificationService.AlertPolicies, {
  AlertTargets: {
    INDIVIDUAL: 'Individual',
    GLOBAL: 'Global'
  },

  isAssistantOnline(channel) {
    let customerId = channel.customerId;
    let customer = Users.findOneCustomer(customerId);
    let assistant = customer.assistant();
    if (assistant && assistant.status && assistant.status.online) {
      return true;
    }
    return false;
  },

  createForChannelIfNotExists(channel) {
    let self = this;
    let policy = NotificationService.AlertPolicies.findOne({channelId: channel._id});
    if (!!policy) return;

    let isAssistantOnline = self.isAssistantOnline(channel);

    let delayIndividual = isAssistantOnline?
      Meteor.settings.notificationService.alertDelayInSecs.individual:
      Meteor.settings.notificationService.alertDelayInSecs.individualOffline;
    let delayGlobal = Meteor.settings.notificationService.alertDelayInSecs.global;

    let doc = {
      channelId: channel._id,
      schedules: [
        {notifyAt: moment().add(delayIndividual, 's').valueOf(), target: self.AlertTargets.INDIVIDUAL},
        {notifyAt: moment().add(delayGlobal, 's').valueOf(), target: self.AlertTargets.GLOBAL}
      ]
    };
    NotificationService.AlertPolicies.insert(doc);
  },

  removeForChannel(channel) {
    NotificationService.AlertPolicies.remove({channelId: channel._id});
  }
});
