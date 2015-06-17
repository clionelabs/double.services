// API client for a slack team
NotificationService.SlackTeamClient = {
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
    self.client.on('error', Meteor.bindEnvironment(() => {self._clientOnError()}));
    self.client.login();
  },

  /**
   * Callback when RTC client is connected
   */
  _clientOnOpen() {
    console.log('[NotificationService.TeamClient] clientOnOpen: ', this.client.team.name);
    this._startHandlingAlertJobs();
    // this._updateAllChannels();
    // this._observingOutingMessages();
  },

  /**
   * Callback when RTC client received error
   */
  _clientOnError(error) {
    console.log('[NotificationService.TeamClient] clientOnError: ', error);
  },

  _startHandlingAlertJobs() {
    let self = this;
    let queue = NotificationService.AlertJobs.processJobs('slack', {}, Meteor.bindEnvironment(function(job, callback) {
      console.log("process job: ", job);
      let dChannelId = job.data.channelId;
      self._sendAlertMessage(dChannelId);
      job.done();
      job.remove();
      callback();
    }));
  },

  _sendAlertMessage(dChannelId) {
    let dChannel = D.Channels.findOne(dChannelId);
    let channelId = dChannel.extra.channel.id
    let channel = this.client.getChannelGroupOrDMByID(channelId);
    channel.send("Alert");
  }
}

