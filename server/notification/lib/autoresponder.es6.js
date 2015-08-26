NotificationService.Autoresponder = {
  onChannelPending(channel) {
    let isAutoResponseOn = D.Configs.get(D.Configs.Keys.IS_AUTO_RESPONSE_ON);
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
