/**
 * @property {String} channelId D.Channel id
 * @property {String} userName Display name of the sender
 * @property {String} content Message content
 * @property {String} inOut Inbound or Outbound
 */
D.Messages = new Meteor.Collection("d-messages");

D.Messages.InOut = {
  IN: 1,
  OUT: 2
}
