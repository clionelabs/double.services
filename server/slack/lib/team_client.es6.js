// API client for a slack team
SlackService.TeamClient = {
  FETCH_MAX: 1000,

  client: null,

  _teamName: null,

  _authToken: null,

  _sentMessageIds: {},

  _observeHandler: null,

  _updatingChannels: {},

  /*
   * Initialize and start slack RTC client, given the authToken
   * @param {String} authToken
   */
  init(authToken) {
    let self = this;
    self._authToken = authToken;
    self.connect();
  },

  connect() {
    let self = this;
    let authToken = self._authToken;
    self.client = new Slack(authToken, true, true); // autoReconnect = true, autoMark = true
    self.client.on('open', Meteor.bindEnvironment(() => {self._clientOnOpen()}));
    self.client.on('close', Meteor.bindEnvironment(() => {self._clientOnClose()}));
    self.client.on('message', Meteor.bindEnvironment((message) => {self._clientOnMessage(message)}));
    self.client.on('messageSent', Meteor.bindEnvironment((message) => {self._clientOnMessageSent(message)}));
    self.client.on('presenceChange', Meteor.bindEnvironment((user, presence) => {self._clientOnPresenceChange(user, presence)}));
    self.client.on('error', Meteor.bindEnvironment((error) => {self._clientOnError(error)}));

    try {
      self.client.login();
    } catch (ex) {
      console.log("[SlackService.TeamClient] login error for teamToken: ", self._authToken, "ex: ", ex);
    }
  },

  disconnect() {
    let self = this;
    self.client.disconnect();
  },

  /**
   * Callback when RTC client is connected
   */
  _clientOnOpen() {
    console.log('[SlackService.TeamClient] clientOnOpen: ', this.client.team.name);
    this._teamName = this.client.team.name;
    this._updateAllChannels();
    this._updateAllChannelMembers();
    this._observingOutingMessages();
  },

  /**
   * Callback when RTC client is closed
   */
  _clientOnClose() {
    console.log('[SlackService.TeamClient] clientOnClose: ', this._teamName);
  },

  /**
   * Callback when RTC client received message
   */
  _clientOnMessage(message) {
    console.log('[SlackService.TeamClient] clientOnMessage: ', this.client.team.name);
    let self = this;
    let channel = self.client.getChannelGroupOrDMByID(message.channel);
    // sometimes, it fails to fetch in the new messages because rtm api is faster than the web api
    //   i.e.  rtc indicates there is a new message, but calling channels.history api returns nothing
    // so we do 2 extra retries if no new messages are found (we are expecting at least one)
    self._updateChannel(channel, 2);
  },

  /**
   * Callback when RTC client received presence_change
   */
  _clientOnPresenceChange(user, presence) {
    console.log('[SlackService.TeamClient] clientOnPresenceChange: ', this.client.team.name, user.id, presence);
    let self = this;
    _.each(self._allChannelsDMsAndGroups(), function(channel) {
      if (_.indexOf(self._channelMembers(channel), user.id) !== -1) {
        self._updateChannelMembers(channel);
      }
    });
  },

  /**
   * Callback when RTC client received messageSent
   */
  _clientOnMessageSent(message) {
    let self = this;
    let channel = self.client.getChannelGroupOrDMByID(message.channel);
    console.log('[SlackService.TeamClient] clientOnMessageSent: ', this.client.team.name, channel.name, self._sentMessageIds[message.id]);

    let dMessageId = self._sentMessageIds[message.id];
    if (dMessageId) {
      // Set it as OUTING_DELIEVERED, and remove them later when we done fetching history
      D.Messages.update(dMessageId, {$set: {inOut: D.Messages.InOut.OUTING_DELIVERED}});
    }

    // Sometimes, it fails to fetch in the newly sent messages.
    //   i.e. `channel.history` slack API call didn't return the newly sent messages.
    //   It might due to a small delay between the rtc onMessageSent callback and the message insertion on the slack side
    // so we do 2 extra retries here if no new messages are found (we are expecting at least one)
    self._updateChannel(channel, 2);
  },

  /**
   * Callback when RTC client received error
   */
  _clientOnError(error) {
    if (this._teamName) {
      console.log('[SlackService.TeamClient] clientOnError: ', error, 'team name: ', this._teamName);
    } else {
      console.log('[SlackService.TeamClient] clientOnError: ', error, 'team token: ', this._authToken);
    }
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

  _allChannelsDMsAndGroups() {
    let self = this;
    let all = [].concat(_.values(self.client.channels), _.values(self.client.dms), _.values(self.client.groups));
    return all;
  },

  _channelMembers(channel) {
    if (channel.is_group || channel.is_channel) {
      return _.without(channel.members, this.client.self.id);
    } else if (channel.is_im) {
      return [channel.user];
    }
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
   * Update user presence for all users, all channels
   */
  _updateAllChannelMembers() {
    let self = this;
    let all = [_.values(self.client.channels), _.values(self.client.dms), _.values(self.client.groups)];
    _.each(self._allChannelsDMsAndGroups(), function(channel) {
      self._updateChannelMembers(channel);
    });
  },

  /**
   * Update presences of all members of a particular channel
   * @params {Objecg} user Slack user object
   */
  _updateChannelMembers(channel) {
    console.log("[SlackService.TeamClient] updateChannelMembers for channel", channel.name);
    let self = this;
    let dChannel = self._dChannel(channel);
    if (!dChannel) return; // not supposed to happen
    let members = _.map(self._channelMembers(channel), function(userId) {
      let user = self.client.getUserByID(userId);
      return {
        name: user.name,
        presence: user.presence
      }
    });
    D.Channels.update(dChannel._id, {$set: {'extra.members': members}});
  },

  /**
   * Update D.Channels and D.Messages for a particular slack channel
   * It will
   *   i) create D.Channels, if not already existed for this slack channel
   *   ii) fetch all the unfetched messages and put them into D.Messages
   *     To ensure only fetching unfetched messages, an lastMessageTS property is attached
   *     to D.Channel to indicate the timestmap of the last fetched message.
   * @params {Object} channel Slack channel object
   * @params {Integer} numberOfRetriesIfNoMessages
   * .
   */
  _updateChannel(channel, numberOfRetriesIfNoMessages = 0) {
    if (this._shouldIgnore(channel)) return;

    console.log("[SlackService.TeamClient] updating channel: ", channel.name, ", retries if none: ", numberOfRetriesIfNoMessages);
    let self = this;
    if (self._updatingChannels[channel.id]) {
      console.log("[SlackService.TeamClient] already updating: ", channel.name, ". Return");
      return;
    }

    self._updatingChannels[channel.id] = true;

    let dChannel = self._upsertDChannel(channel);
    self._fetchChannelHistory(channel, dChannel.extra.lastMessageTS, Meteor.bindEnvironment(function(result) {
      if (!result.ok) {
        console.log("[SlackService.TeamClient] fetch ", channel.name, " failed: ", result);
      } else {
        console.log("[SlackService.TeamClient] inserting ", channel.name, " messages: ", result.messages.length);
        self._removeOutingDelieveredMessages(dChannel);
        _.each(result.messages, function(message) {
          self._insertMessage(message, dChannel._id);
        });

        if (result.messages.length === 0 && numberOfRetriesIfNoMessages > 0) {
          Meteor.setTimeout(function() {
            self._updateChannel(channel, numberOfRetriesIfNoMessages - 1);
          }, 1000);
        }
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
      let autoReplyContent = D.Configs.get(D.Configs.Keys.AUTO_RESPONSE_MESSAGE);

      let selfUserId = this.client.self.id;
      let userId = message.user;
      let userName = userId? self.client.users[userId].name: '=UNKNOWN=';
      let inOut = selfUserId === userId? D.Messages.InOut.OUT: D.Messages.InOut.IN;
      let isAutoReply = message.text === autoReplyContent;

      let decodedText = self._decodeMessageText(message);
      let timestamp = message.ts * 1000;

      let options = {
        channelId: dChannelId,
        content: decodedText,
        inOut: inOut,
        isAutoReply: isAutoReply,
        userName: userName,
        timestamp: timestamp
      }
      D.Messages.insert(options);

      let dChannel = D.Channels.findOne(dChannelId);
      if (!dChannel.extra.lastMessageTS || dChannel.extra.lastMessageTS < message.ts) {
        let channelOptions = {
          $set: {
            lastMessage: {
              inOut: inOut,
              isAutoReply: isAutoReply,
              timestamp: timestamp
            }
          },
          $max: {'extra.lastMessageTS': message.ts}
        }
        D.Channels.update(dChannelId, channelOptions);
      }
    }
  },

  /**
   * Decode slack message content
   * <@Uxxxxxxxx> -> @username
   * <http:xxx> -> xxx
   *   uploaded file, i.e. photo-xxxxxxxx.xxx -> downloadable public url
   * <mailto:xxx> ->xxx
   *
   * Ref: https://api.slack.com/docs/formatting
   *
   * @params {Object} message Slack message object
   */
  _decodeMessageText: function(message) {
    let text = message.text;
    let file = message.file;
    let self = this;
    let decodedText = text.replace(/<@(U.*?)>/g, function(match, p1) {
      let index = p1.indexOf("|");
      let userId;
      if (index === -1) {
        userId = p1;
      } else {
        userId = p1.substring(0, index);
      }
      let user = self.client.users[userId];
      return user? `@${user.name}`: match;
    });
    decodedText = decodedText.replace(/<(http.*?)>/g, function(match, p1) {
      let index = p1.indexOf("|");
      if (index === -1) {
        return p1;
      } else {
        let content = p1.substring(index+1);

        // if the content is an uploaded file, then return a downloadable url
        if (file && file.title && file.title === content) {
          return file.permalink_public;
        }
        return p1.substring(index+1);
      }
    });
    decodedText = decodedText.replace(/<(mailto.*?)>/g, function(match, p1) {
      let index = p1.indexOf("|");
      if (index === -1) { // not supposed to happen
        return p1;
      } else {
        return p1.substring(index+1);
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
    self._observeHandler = D.Messages.find({inOut: D.Messages.InOut.OUTING}, {sort: {timestamp: 1}}).observe({
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
    if (dChannel.category !== D.Channels.Categories.SLACK) {
      return;
    }
    let channelId = dChannel.extra.channel.id;
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
