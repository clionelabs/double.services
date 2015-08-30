NotificationService.Autoresponder = {
  onChannelPending(channel) {
    let isAutoResponseOn = D.Configs.get(D.Configs.Keys.IS_AUTO_RESPONSE_ON);
    if (!isAutoResponseOn) return;
    if (this._isInBusinessHour()) return;
    this._send(channel);
  },

  _isInBusinessHour() {
    let businessTimezoneOffset = D.Configs.get(D.Configs.Keys.BUSINESS_TIMEZONE_OFFSET_IN_MINS);
    let businessStart = D.Configs.get(D.Configs.Keys.BUSINESS_START_TIME_IN_SECS);
    let businessEnd = D.Configs.get(D.Configs.Keys.BUSINESS_END_TIME_IN_SECS);
    let businessHolidays = D.Configs.get(D.Configs.Keys.BUSINESS_HOLIDAYS) || [];

    // if any of these are not set, then assume it's always in business
    if (!businessTimezoneOffset || !businessStart || !businessEnd) {
      return true;
    }

    businessTimezoneOffset = parseInt(businessTimezoneOffset);
    businessStart = parseInt(businessStart);
    businessEnd = parseInt(businessEnd);

    let current = moment().utcOffset(businessTimezoneOffset);
    let secondsOfTheDay = current.hours() * 3600 + current.minutes() * 60 + current.seconds();
    let currentDate = current.format("YYYY-MM-DD");
    let currentDayOfWeek = current.day();

    // hardcoded Sunday and Saturday are holidays
    if (currentDayOfWeek === 0 || currentDayOfWeek === 6) return false;
    if (secondsOfTheDay < businessStart || secondsOfTheDay > businessEnd) return false;
    let isHoliday = _.reduce(businessHolidays, function(memo, holiday) {
      return memo | holiday.date === currentDate;
    }, false);
    if (isHoliday) return false;

    return true;
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
