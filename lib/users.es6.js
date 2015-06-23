Users = _.extend({}, D.Users, {
  findOneCustomer(selector={}) {
    let user = Users.findOne(selector);
    if (user) {
      _.extend(user, Customer);
    }
    return user;
  }
});

Customer = {
  assistant() {
    let placement = D.Placements.findOne({customerId: this._id});
    if (!placement) return null;
    let assistant = Users.findOne({_id: placement.assistantId});
    return assistant;
  }
}
