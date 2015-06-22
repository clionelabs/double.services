/**
 * Notification state machine for DChannel
 *   States: Replied, Pending, Acknowledged
 *   Events: Inbound, Outbound, Acknowledge
 *
 * going into Pending state will trigger alert policy, while moving out of it will stop it.
 *
 * @param {D.Channel} channel
 **/
NotificationService.ChannelStateMachine = function(channel) {
  let initialState = 'empty';
  if (channel.notification) {
    initialState = channel.notification.state;
  }

  _.extend(this, channel);
  let stateMachine = StateMachine.create({
    initial: {state: initialState, event: 'init', defer: true},
    error: function(eventName, from, to, args, errorCode, errorMessage) {
      return 'event ' + eventName + ' was naughty :- ' + errorMessage;
    },
    events: [
      {name: 'inbound', from: ['empty', 'replied', 'acknowledged'], to: 'pending'},
      {name: 'outbound', from: ['empty', 'pending', 'acknowledged'], to: 'replied'},
      {name: 'acknowledge', from: 'pending', to: 'acknowledged'}
    ],
    callbacks: {
      onenterstate: function(event, from, to) {
        let channel = this;
        D.Channels.update(channel._id, {$set: {'notification.state': to}});
      },
      onenterpending: function(event, from, to) {
        let channel = this;
        if (from === 'none') return;
        console.log("onenterpending: ", channel.extra.channel.name, event, from, to);
        NotificationService.AlertPolicies.createForChannelIfNotExists(channel);
      },
      onenterreplied: function(event, from, to) {
        let channel = this;
        if (from === 'none') return;
        console.log("onenterpending: ", channel.extra.channel.name, event, from, to);
        NotificationService.AlertPolicies.removeForChannel(channel);
      },
      onenteracknowledged: function(event, from, to) {
        let channel = this;
        if (from === 'none') return;
        console.log("onenterpending: ", channel.extra.channel.name, event, from, to);
        NotificationService.AlertPolicies.removeForChannel(channel);
      }
    }
  });
  _.extend(this, stateMachine);
  this.init();
}
