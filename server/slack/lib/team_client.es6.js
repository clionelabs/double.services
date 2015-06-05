// API client for a slack team
SlackService.TeamClient = {
  FETCH_MAX: 1000,

  client: null,

  /*
   * Initialize and start slack RTC client, given the authToken
   * @param {String} authToken
   */
  init(authToken) {
    let self = this;
    self.client = new Slack(authToken, true, true); // autoReconnect = true, autoMark = true
    self.client.on('open', Meteor.bindEnvironment(() => {self._clientOnOpen()}));
    self.client.on('message', Meteor.bindEnvironment((message) => {self._clientOnMessage(message)}));
    self.client.on('error', Meteor.bindEnvironment(() => {self._clientOnError()}));
    self.client.login();
  },

  /**
   * Callback when RTC client is connected
   */
  _clientOnOpen() {
    console.log('[SlackService.TeamClient] clientOnOpen: ', this.client.team.name);
    this._updateAllChannels();
  },

  /**
   * Callback when RTC client received message
   */
  _clientOnMessage(message) {
    console.log('[SlackService.TeamClient] clientOnMessage: ', this.client.team.name);
    let self = this;
    let channel = self.client.getChannelGroupOrDMByID(message.channel);
    self._updateChannel(channel);
  },

  /**
   * Callback when RTC client received error
   */
  _clientOnError(error) {
    console.log('[SlackService.TeamClient] clientOnError: ', error);
  },

  /**
   * Get the D.Channel selector for a given slack channel
   * @param {Object} channel Slack channel object
   */
  _dChannelSelector(channel) {
    return {category: D.Channels.Categories.SLACK, identifier: channel.id};
  },

  /**
   * Insert/update the DChannel for a given slack channel
   * @param {Object} channel Slack channel object
   * @return {D.Channel}
   */
  _upsertDChannel(channel) {
    let self = this;
    let dChannelSelector = self._dChannelSelector(channel);
    let options = {
      $set: {
        'category': D.Channels.Categories.SLACK,
        'identifier': channel.id,
        'extra.channel.id': channel.id,
        'extra.channel.name': channel.name,
        'extra.channel.type': channel.getType(),
        'extra.team.id': self.client.team.id,
        'extra.team.name': self.client.team.name
      },
      $setOnInsert: {
        'extra.lastMessageTS': 0
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
  _dChannel(channel) {
    let channelSelector = this._dChannelSelector(channel);
    return D.Channels.findOne(channelSelector);
  },

  /**
   * Update D.Channels and D.Messages for all slack channels involved by the authenticated slack user.
   */
  _updateAllChannels() {
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
  _updateChannel(channel) {
    console.log("[SlackService.TeamClient] updating channel: ", channel.name);
    let self = this;
    let dChannel = self._upsertDChannel(channel);

    self._fetchChannelHistory(channel, dChannel.extra.lastMessageTS, Meteor.bindEnvironment(function(result) {
      if (!result.ok) {
        console.log("[SlackService.TeamClient] fetch failed: ", result);
      } else {
        console.log("[SlackService.TeamClient] inserting messages: ", result.messages.length);
        _.each(result.messages, function(message) {
          self._insertMessage(message, dChannel._id);
        });
      }
    }));
  },

  /**
   * @params {Object} message Slack message
   * @params {String} dChannelId
   */
  _insertMessage(message, dChannelId) {
    let self = this;
    if (message.type === 'message') {
      let selfUserId = this.client.self.id;
      let userId = message.user;
      let userName = userId? self.client.users[userId].name: '=UNKNOWN=';
      let inOut = selfUserId === userId? D.Messages.InOut.OUT: D.Messages.InOut.IN;
      let decodedText = self._decodeMessageText(message.text);
      let options = {
        channelId: dChannelId,
        content: decodedText,
        inOut: inOut,
        extra: {
          userName: userName,
          ts: message.ts
        }
      }
      D.Messages.insert(options);
      D.Channels.update(dChannelId, {$max: {'extra.lastMessageTS': message.ts}});
    }
  },

  /**
   * Decode slack message content
   * <@Uxxxxxxxx> -> @username
   *
   * @params {String} text
   */
  _decodeMessageText: function(text) {
    let self = this;
    let decodedText = text.replace(/<@(U.*?)>/g, function(match, p1) {
      let user = self.client.users[p1];
      return user? `@${user.name}`: match;
    });
    return decodedText;
  },

  /**
   * Asynchronously call slack api and fetch all the messages for a particular channel.
   * @params {Object} channel Slack channel object
   * @params {String} oldestTS Only fetch messages after timestamp (slack format)
   * @params {Fn} callback Callback when api call is done
   */
  _fetchChannelHistory(channel, oldestTS, callback) {
    let self = this;

    let method = self._fetchChannelMethod(channel);
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
  },

  /**
   * Get the API method for fetching history of a channel, depending on the type (channel, im, or gorup)
   * @params {Object} channel Slack channel object
   */
  _fetchChannelMethod(channel) {
    let method = 'channels.history';
    if (channel.getType() === 'Group') {
      method = 'groups.history';
    } else if (channel.getType() === 'DM') {
      method = 'im.history';
    }
    return method;
  }
}
