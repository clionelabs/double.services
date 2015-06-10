/**
 * @property {String} channelId D.Channel id
 * @property {String} userName Display name of the sender
 * @property {String} content Message content
 * @property {String} inOut Inbound or Outbound
 * @property {String} timestamp
 *    IN: Inbound message, confirmed and read from external provider
 *    OUT: Outbound message, confirmed and read from external provider
 *    OUTING: Outbound message, entered from dashboard, but not yet sent to external provider
 *    OUTING_DELIVERED: Outbound message, entered from dashboard and already sent to external provider
 *
 *    The message content of OUTING and OUTING_DELIVERED are what we generated in our dashboard. The message
 *    will then be sent to external provider.
 *    The message content of IN and OUT are what we read from external provider. They are the final confirmed
 *    content as perceived by the external provider.
 */
D.Messages = new Meteor.Collection("d-messages");

D.Messages.InOut = {
  IN: 1,
  OUT: 2,
  OUTING: 3,
  OUTING_DELIVERED: 4
}

D.Messages.allow({
  insert(userId) {
    return Users.isAdmin(userId) || Users.isAssistant(userId);
  },
  update(userId) {
    return Users.isAdmin(userId) || Users.isAssistant(userId);
  },
  remove(userId) {
    return Users.isAdmin(userId) || Users.isAssistant(userId);
  }
});
