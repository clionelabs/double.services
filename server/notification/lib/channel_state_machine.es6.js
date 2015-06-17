/**
 * Attach state machine behaviour to DChannel
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
        if (from === 'none') return;
        console.log("onenterpending: ", event, from, to);
        let channel = this;
        NotificationService.AlertPolicy.startChannelAlert(channel._id);
      },
      onenterreplied: function(event, from, to) {
        if (from === 'none') return;
        console.log("onenterreplied: ", event, from, to);
        let channel = this;
        NotificationService.AlertPolicy.endChannelAlert(channel._id);
      },
      onenteracknowledged: function(event, from, to) {
        if (from === 'none') return;
        console.log("onenteracknowledged: ", event, from, to);
        let channel = this;
        NotificationService.AlertPolicy.endChannelAlert(channel._id);
      }
    }
  });
  _.extend(this, stateMachine);
  this.init();
}
