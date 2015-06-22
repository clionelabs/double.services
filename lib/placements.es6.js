/**
 * @property {String} customerId (unique)
 * @property {String} assistantId
 */

D.Placements = new Meteor.Collection("placements", {
  transform: (doc) => {
    return _.extend(doc, D.Placement);
  }
});

D.Placements.allow({
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

D.Placements.unassign = (customerId, callback) => {
  var placement = D.Placements.findOne( { customerId: customerId } );
  D.Placements.remove(placement._id, callback);
};

D.Placements.assign = (customerId, assistantId, callback) => {
  var placement = D.Placements.findOne( { customerId: customerId } );
  if (placement) {
    D.Placements.update(placement._id, { $set: { assistantId: assistantId }}, callback);
  } else {
    D.Placements.insert( { customerId: customerId, assistantId: assistantId }, callback);
  }
};

D.Placement = {
  assistantDisplayName() {
    var assistant = Users.findOne(this.assistantId);
    return assistant.displayName();
  }
};
