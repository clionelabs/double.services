Users = _.extend({}, D.Users, {
  findOneCustomer(selector={}) {
    let user = Users.findOne(selector, {transform: function(doc) {
      return _.extend(doc, User, Customer);
    }});
    return user;
  }
});

User = _.extend({}, D.User);

Customer = {
  assistant() {
    let placement = D.Placements.findOne({customerId: this._id});
    if (!placement) return null;
    let assistant = Users.findOne({_id: placement.assistantId});
    return assistant;
  }
}
