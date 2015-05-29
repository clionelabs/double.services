// API client for a slack team
SlackService.TeamClient = {
  FETCH_MAX: 1000,

  client: null,

  /*
   * Initialize and start slack RTC client, given the authToken
   * @param {String} authToken
   */
  init: function(authToken) {
    let self = this;
    this.client = new Slack(authToken, true, true); // autoReconnect = true, autoMark = true
    this.client.on('open', Meteor.bindEnvironment(() => {self._clientOnOpen()}));
    this.client.on('message', Meteor.bindEnvironment((message) => {self._clientOnMessage(message)}));
    this.client.on('error', Meteor.bindEnvironment(() => {self._clientOnError()}));
    this.client.login();
  },

  /**
   * Callback when RTC client is connected
   */
  _clientOnOpen: function() {
    console.log('[SlackService.TeamClient] clientOnOpen: ', this.client.team.name);
    this._updateAllChannels();
  },

  /**
   * Callback when RTC client received message
   */
  _clientOnMessage: function(message) {
    console.log('[SlackService.TeamClient] clientOnMessage: ', this.client.team.name);
    let self = this;
    let channel = self.client.getChannelGroupOrDMByID(message.channel);
    self._updateChannel(channel);
  },

  /**
   * Callback when RTC client received error
   */
  _clientOnError: function(error) {
    console.log('[SlackService.TeamClient] clientOnError: ', error);
  },

  /**
   * Get the D.Channel selector for a given slack channel
   * @param {Object} channel Slack channel object
   */
  _dChannelSelector: function(channel) {
    let channelSelector = {category: D.Channels.Categories.SLACK, identifier: channel.id};
    return channelSelector;
  },

  /**
   * Insert/update the DChannel for a given slack channel
   * @param {Object} channel Slack channel object
   * @return {D.Channel}
   */
  _upsertDChannel: function(channel) {
    let self = this;
    let dChannelSelector = self._dChannelSelector(channel);
    let options = {
      $set: {
        category: D.Channels.Categories.SLACK,
        identifier: channel.id,
        extra: {
          channelId: channel.id,
          channelName: channel.name,
          channelType: channel.getType(),
          teamId: self.client.team.id,
          teamName: self.client.team.name,
        }
      },
      $setOnInsert: {
        extra: {
          lastMessageTS: 0
        }
      }
    };
    D.Channels.upsert(dChannelSelector, options);
    return self._dChannel(channel);
  },

  /**
   * Get the DChannel for a given slack channel
   * @param {Object} channel Slack channel object
   * @return {D.Channel} D.Channel, null if not existed
   */
  _dChannel: function(channel) {
    let channelSelector = this._dChannelSelector(channel);
    return D.Channels.findOne(channelSelector);
  },

  /**
   * Update D.Channels and D.Messages for all slack channels involved by the authenticated slack user.
   */
  _updateAllChannels: function() {
    let self = this;
    _.each(_.values(self.client.channels), function(channel) {
      if (channel.is_member) {
        self._updateChannel(channel);
      }
    });
    _.each(_.values(self.client.dms), function(dm) {
      if (dm.is_open) {
        self._updateChannel(dm);
      }
    });
    _.each(_.values(self.client.groups), function(group) {
      self._updateChannel(group);
    });
  },

  /**
   * Update D.Channels and D.Messages for a particular slack channel
   * It will
   *   i) create D.Channels, if not already existed for this slack channel
   *   ii) fetch all the unfetched messages and put them into D.Messages
   *     To ensure only fetching unfetched messages, an lastMessageTS property is attached
   *     to D.Channel to indicate the timestmap of the last fetched message.
   * @params {Object} channel Slack channel object
   * .
   */
  _updateChannel: function(channel) {
    console.log("[SlackService.TeamClient] updating channel: ", channel.name);
    let self = this;
    let dChannel = self._dChannel(channel);
    let oldestTS = dChannel && dChannel.extra.lastMessageTS? dChannel.extra.lastMessageTS: null;

    self._fetchChannelHistory(channel, oldestTS, Meteor.bindEnvironment(function(result) {
      if (!result.ok) {
        console.log("[SlackService.TeamClient] fetch failed: ", result);
      } else {
        console.log("[SlackService.TeamClient] inserting messages: ", result.messages.length);
        if (result.messages.length > 0) {
          let dChannel = self._upsertDChannel(channel);
          let oldestTS = dChannel.extra.lastMessageTS;
          _.each(result.messages, function(message) {
            self._insertMessage(message, dChannel._id);
            if (!oldestTS || message.ts > oldestTS) oldestTS = message.ts;
          });
          if (!dChannel.extra.lastMessageTS || oldestTS > dChannel.extra.lastMessageTS) {
            D.Channels.update(dChannel._id, {$set: {'extra.lastMessageTS': oldestTS}});
          }
        }
      }
    }));
  },

  /**
   * @params {Object} message Slack message
   * @params {String} dChannelId
   */
  _insertMessage: function(message, dChannelId) {
    let self = this;
    if (message.type === 'message') {
      let userId = message.user;
      let userName = userId? self.client.users[userId].name: '=UNKNOWN=';
      let options = {
        channelId: dChannelId,
        content: message.text,
        extra: {
          userName: userName,
          ts: message.ts
        }
      }
      D.Messages.insert(options);
    }
  },

  /**
   * Asynchronously call slack api and fetch all the messages for a particular channel.
   * @params {Object} channel Slack channel object
   * @params {String} oldestTS Only fetch messages after timestamp (slack format)
   * @params {Fn} callback Callback when api call is done
   */
  _fetchChannelHistory: function(channel, oldestTS, callback) {
    let self = this;
    let method = 'channels.history';
    if (channel.getType() === 'Group') {
      method = 'groups.history';
    } else if (channel.getType() === 'DM') {
      method = 'im.history';
    }

    let teamId = self.client.team.id;
    let channelId = channel.id;

    let params = {channel: channelId};
    if (Meteor.settings.fetchMax) {
      _.extend(params, {count: self.FETCH_MAX});
    }
    if (oldestTS) {
      _.extend(params, {oldest: oldestTS});
    }

    self.client._apiCall(method, params, callback);
  }
}
