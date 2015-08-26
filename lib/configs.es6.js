/**
 * System configuration - key-value pairs
 */
D.Configs = new Meteor.Collection("d-configs");

D.Configs.allow({
  insert(userId) {
    return Users.isAdmin(userId);
  },
  update(userId) {
    return Users.isAdmin(userId);
  },
  remove(userId) {
    return Users.isAdmin(userId);
  }
});

D.Configs.Keys = {
  IS_AUTO_RESPONSE_ON: 'IS_AUTO_RESPONSE_ON',
  AUTO_RESPONSE_MESSAGE: 'AUTO_RESPONSE_MESSAGE',
  BUSINESS_START_TIME_IN_SECS: 'BUSINESS_START_TIME_IN_SECS',
  BUSINESS_END_TIME_IN_SECS: 'BUSINESS_END_TIME_IN_SECS'
}

D.Configs.get = function(key) {
  let config = D.Configs.findOne({key: key});
  if (!config) return null;
  return config.value;
}

D.Configs.set = function(key, value, callback) {
  let config = D.Configs.findOne({key: key});
  if (config) {
    D.Configs.update({_id: config._id}, {$set: {key: key, value: value}}, callback);
  } else {
    D.Configs.insert({key: key, value: value}, callback);
  }
}
