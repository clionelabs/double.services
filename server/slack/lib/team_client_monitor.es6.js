// monitor the health status of the slack connections
SlackService.TeamClientMonitor = {
  API_ENDPOINT: 'https://slack.com/api/',
  CHECK_PONG_INTERVAL: 30 * 1000, // every 30 seconds
  CHECK_MESSAGES_INTERVAL: 15 * 60 * 1000, // every 15 mins
  SHOULD_RECONNECT_SECONDS: 60,

  _team: null,
  _slackClient: null,

  init(team, slackClient) {
    let self = this;
    self._team = team;
    self._slackClient = slackClient;

    self._updateChannelStatuses();
    Meteor.setInterval(function() {
      self._updateChannelStatuses();
    }, self.CHECK_MESSAGES_INTERVAL);

    self._updateWSStatus();
    Meteor.setInterval(function() {
      self._updateWSStatus();
      self._checkShouldTriggerReconnect();
    }, self.CHECK_PONG_INTERVAL);
  },

  _updateChannelStatuses() {
    let self = this;
    let channelStatuses = self._checkChannels();
    SlackService.Teams.update({_id: self._team._id}, {$set: {
      'monitoring.lastChannelsCheckedAt': moment().valueOf(),
      'monitoring.channelStatuses': channelStatuses
    }});
  },

  _updateWSStatus() {
    let self = this;
    let wsStatus = self._checkWebsocket();
    SlackService.Teams.update({_id: self._team._id}, {$set: {
      'monitoring.lastWSCheckedAt': moment().valueOf(),
      'monitoring.wsStatus': wsStatus
    }});
  },

  _checkWebsocket() {
    let self = this;
    let lastPong = moment(self._slackClient.client._lastPong).format();
    return {
      lastPong: lastPong
    }
  },

  /**
   * Sometimes, the websocket are closed for no apparent reasons:
   *   Ref issue: https://github.com/slackhq/node-slack-client/issues/53
   *
   * If it does, we should trigger a reconnection.
   *   Hopefully, it will be handled internally with the slack library later:
   *     Ref: https://github.com/slackhq/node-slack-client/pull/66/files
   */
  _checkShouldTriggerReconnect() {
    let self = this;
    let slackTeam = SlackService.Teams.findOne(self._team._id);

    let shouldReconnect = moment().diff(moment(slackTeam.monitoring.wsStatus.lastPong), 's')
      > self.SHOULD_RECONNECT_SECONDS;

    if (shouldReconnect) {
      console.log("[SlackService.TeamClientMonitor] reconnect a slack client: ", self._slackClient.client.team.name);
      self._slackClient.disconnect();
      self._slackClient.connect();
    }
  },

  _checkChannels() {
    let self = this;
    let selector = {
      category: D.Channels.Categories.SLACK,
      'extra.team.id': self._team.teamId,
      customerId: {$exists: true}
    };

    let channelStatuses = {};
    D.Channels.find(selector).forEach(function(dChannel) {
      let isLatestMessageMatched = self._checkChannelLatestMessage(dChannel);
      let hasNoOuting = self._checkChannelPendingOutMessage(dChannel);
      channelStatuses[dChannel._id] = {
        isLatestMessageMatched: isLatestMessageMatched,
        hasNoOuting: hasNoOuting
      }
    });
    return channelStatuses;
  },

  _checkChannelPendingOutMessage(dChannel) {
    let message = D.Messages.findOne({
      channelId: dChannel._id,
      inOut: {$in: [D.Messages.InOut.OUTING, D.Messages.In, D.Messages.InOut.OUTING_DELIVERED]}
    });
    return message === undefined;
  },

  _checkChannelLatestMessage(dChannel) {
    let self = this;
    let method = 'channels.history';
    if (dChannel.extra.channel.type === 'Group') {
      method = 'groups.history';
    } else if (dChannel.extra.channel.type === 'DM') {
      method = 'im.history';
    }

    let wrappedCall = Meteor.wrapAsync(HTTP.post);

    let url = self.API_ENDPOINT + method;
    let options = {
      params: {
        token: self._slackClient.client.token,
        channel: dChannel.identifier,
        count: 1
      }
    }

    try {
      let result = wrappedCall(url, options);
      let response = result.data;
      if (response.ok) {
        let messages = response.messages;
        let lastMessage = _.last(messages);
        if (lastMessage) {
          return lastMessage.ts === dChannel.extra.lastMessageTS;
        } else {
          // Other than being the channels are really empty, it could also be possible
          // that sometimes all the messages could be cleared by slack (maybe exceeding limits?)
          // In this case, it will not agree with what we already fetched
          // Here, if there is no lastMessage, we just assume it's being correct
          return true;
        }
      } else {
      }
    } catch (error) {
      console.error("[SlackService.TeamClientMonitor] error fetching history: ", dChannel._id, result);
      return false;
    }
  }
}
