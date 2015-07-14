// API client for a slack team
SlackService.TeamClient = {
  FETCH_MAX: 1000,

  client: null,

  _sentMessageIds: {},

  _observeHandler: null,

  _updatingChannels: {},

  /*
   * Initialize and start slack RTC client, given the authToken
   * @param {String} authToken
   */
  init(authToken) {
    let self = this;
    self.client = new Slack(authToken, true, true); // autoReconnect = true, autoMark = true
    self.client.on('open', Meteor.bindEnvironment(() => {self._clientOnOpen()}));
    self.client.on('message', Meteor.bindEnvironment((message) => {self._clientOnMessage(message)}));
    self.client.on('messageSent', Meteor.bindEnvironment((message) => {self._clientOnMessageSent(message)}));
    self.client.on('error', Meteor.bindEnvironment(() => {self._clientOnError()}));
    self.client.login();
  },

  /**
   * Callback when RTC client is connected
   */
  _clientOnOpen() {
    console.log('[SlackService.TeamClient] clientOnOpen: ', this.client.team.name);
    this._updateAllChannels();
    this._observingOutingMessages();
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
   * Callback when RTC client received messageSent
   */
  _clientOnMessageSent(message) {
    console.log('[SlackService.TeamClient] clientOnMessageSent: ', this.client.team.name);
    let self = this;
    let dMessageId = self._sentMessageIds[message.id];
    if (dMessageId) {
      // Set it as OUTING_DELIEVERED, and remove them later when we done fetching history
      D.Messages.update(dMessageId, {$set: {inOut: D.Messages.InOut.OUTING_DELIVERED}});
    }
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

  _shouldIgnore(channel) {
    let ignoreChannelNames = null;
    if (Meteor.settings.slackService && Meteor.settings.slackService.ignoreChannelNames) {
      ignoreChannelNames = Meteor.settings.slackService.ignoreChannelNames;
    }
    if (!ignoreChannelNames) {
      return false;
    }

    return _.indexOf(ignoreChannelNames, channel.name) !== -1;
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
    if (this._shouldIgnore(channel)) return;

    console.log("[SlackService.TeamClient] updating channel: ", channel.name);
    let self = this;
    if (self._updatingChannels[channel.id]) {
      console.log("[SlackService.TeamClient] already updating. Return");
      return;
    }

    self._updatingChannels[channel.id] = true;

    let dChannel = self._upsertDChannel(channel);
    self._fetchChannelHistory(channel, dChannel.extra.lastMessageTS, Meteor.bindEnvironment(function(result) {
      if (!result.ok) {
        console.log("[SlackService.TeamClient] fetch failed: ", result);
      } else {
        console.log("[SlackService.TeamClient] inserting messages: ", result.messages.length);
        self._removeOutingDelieveredMessages(dChannel);
        _.each(result.messages, function(message) {
          self._insertMessage(message, dChannel._id);
        });
      }
      self._updatingChannels[channel.id] = false;
    }));
  },

  /**
   * Remove all outbound delievered dmessage
   */
  _removeOutingDelieveredMessages(dChannel) {
    D.Messages.remove({channelId: dChannel._id, inOut: D.Messages.InOut.OUTING_DELIVERED});
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
      let timestamp = moment.unix(message.ts).valueOf();
      let options = {
        channelId: dChannelId,
        content: decodedText,
        inOut: inOut,
        userName: userName,
        timestamp: timestamp
      }
      D.Messages.insert(options);
      D.Channels.update(dChannelId, {$max: {'extra.lastMessageTS': message.ts}});
    }
  },

  /**
   * Decode slack message content
   * <@Uxxxxxxxx> -> @username
   * <http:xxx> -> xxx
   *
   * Ref: https://api.slack.com/docs/formatting
   *
   * @params {String} text
   */
  _decodeMessageText: function(text) {
    let self = this;
    let decodedText = text.replace(/<@(U.*?)>/g, function(match, p1) {
      let user = self.client.users[p1];
      return user? `@${user.name}`: match;
    });
    decodedText = decodedText.replace(/<(http.*?)>/g, function(match, p1) {
      let index = p1.indexOf("|");
      if (index === -1) {
        return p1;
      } else {
        return p1.substring(0, index);
      }
    });
    return decodedText;
  },

  /**
   * Encode sack message content
   * @username -> <@Uxxxx|username>
   *
   * Ref: https://api.slack.com/docs/formatting
   * @params {String} text
   */
  _encodeMessageText: function(text) {
    let self = this;
    let encodedText = text.replace(/@(\S*)/g, function(match, p1) {
      let ret = match;
      _.each(self.client.users, function(user) {
        if (user.name === p1) {
          ret = `<@${user.id}>`
        }
      });
      return ret;
    });
    return encodedText;
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
  },

  /**
   * Observing outing message, and relaying them to slack
   */
  _observingOutingMessages() {
    let self = this;

    if (self._observeHandler) {
      self._observeHandler.stop();
    }
    self._observeHandler = D.Messages.find({inOut: D.Messages.InOut.OUTING}).observe({
      teamClient: self,
      added: function(message) {
        this.teamClient._handleOutingMessage(message);
      }
    });
  },

  /**
   * handle outing message. First, check and see if this slack client is responsible for the message.
   * If not, ignore it. Otherwise, send it to slack
   *
   * @param {D.Message} dMessage
   */
  _handleOutingMessage(dMessage) {
    let self = this;
    let dChannel = D.Channels.findOne(dMessage.channelId);
    let channelId = dChannel.extra.channel.id;
    if (dChannel.category !== D.Channels.Categories.SLACK) {
      return;
    }
    let channel = self.client.getChannelGroupOrDMByID(channelId);
    if (!channel) return;

    console.log("[SlackService.TeamClient] ", self.client.team.name, "sending out message: ", JSON.stringify(dMessage));

    let content = self._encodeMessageText(dMessage.content);
    let result = channel.send(content);
    let sentMessageId = result.id;
    self._sentMessageIds[sentMessageId] = dMessage._id;
  },

  /**
   * @param {Object} channel Slack channel object
   * @param {String} content Message content
   */
  _sendMessage(channel, content, callback) {
    let self = this;
    let method = 'chat.postMessage';
    let params = {
      channel: channel.id,
      text: content,
      as_user: true,
    }
    self.client._apiCall(method, params, Meteor.bindEnvironment(function(result) {
      callback(result);
    }));
  }
}
