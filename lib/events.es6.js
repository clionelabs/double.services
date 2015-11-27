/**
 * Used for inter-services communications
 *
 * @property {String} type
 * @property {Object} data
 */
D.Events = new Meteor.Collection('d-events');

D.Events.allow({
  insert(userId) {
    return Users.isAdmin(userId) || Users.isAssistant(userId);
  },
  update(userId) {
    return Users.isAdmin(userId) || Users.isAssistant(userId);
  },
  remove(userId) {
    return Users.isAdmin(userId) || Users.isAssistant(userId);
  }
});

D.Events.create = (type, data) => {
  D.Events.insert({type: type, data: data, isProcessed: false, createdAt: moment().valueOf()});
};

/**
 * The listener callback should return a true value when the event is processed successfuly
 */
D.Events.listen = (type, callback) => {
  D.Events.find({type: type, isProcessed: false}).observe({
    callback: callback,
    added(e) {
      let ret = this.callback(e.data);
      if (ret) {
        D.Events.update(e._id, {$set: {isProcessed: true}});
      }
    }
  });
}
