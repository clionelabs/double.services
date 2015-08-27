NotificationService.Autoresponder = {
  onChannelPending(channel) {
    let isAutoResponseOn = D.Configs.get(D.Configs.Keys.IS_AUTO_RESPONSE_ON);
    let businessStart = D.Configs.get(D.Configs.Keys.BUSINESS_START_TIME_IN_SECS);
    let businessEnd = D.Configs.get(D.Configs.Keys.BUSINESS_END_TIME_IN_SECS);

    let current = moment().utcOffset(480); // hardcoded HKT timezone +8 (=60 * 8)
    let secondsOfTheDay = current.hours() * 3600 + current.minutes() * 60 + current.seconds();
    let isOutBusiness = false;
    if (businessStart && businessEnd) {
      isOutBusiness = secondsOfTheDay < businessStart || secondsOfTheDay > businessEnd;
    }

    if (!isOutBusiness) return;
    if (!isAutoResponseOn) return;
    this._send(channel);
  },

  _send(channel) {
    let content = D.Configs.get(D.Configs.Keys.AUTO_RESPONSE_MESSAGE);
    if (!content) {
      console.log("missing auto response message config");
      return;
    }
    let doc = {
      channelId: channel._id,
      content: content,
      inOut: D.Messages.InOut.OUTING,
      timestamp: moment().valueOf()
    };
    D.Messages.insert(doc);
  }
}
