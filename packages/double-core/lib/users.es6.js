D.Users = {
  Roles: {
    ADMIN: 'admin',
    CUSTOMER: 'customer',
    ASSISTANT: 'assistant'
  },

  isAdmin(userId) {
    return Roles.userIsInRole(userId, [this.Roles.ADMIN]);
  },

  isCustomer(userId) {
    return Roles.userIsInRole(userId, [this.Roles.CUSTOMER]);
  },

  isAssistant(userId) {
    return Roles.userIsInRole(userId, [this.Roles.ASSISTANT]);
  },

  createAdmin(options) {
    let userId = Accounts.createUser(options);
    Roles.addUsersToRoles(userId, this.Roles.ADMIN);
    return userId;
  },

  createAssistant(options) {
    let userId = Accounts.createUser(options);
    Roles.addUsersToRoles(userId, this.Roles.ASSISTANT);
    return userId;
  },

  createCustomer(options) {
    let userId = Accounts.createUser(options);
    Roles.addUsersToRoles(userId, this.Roles.CUSTOMER);
    return userId;
  },

  findAssistants(selector={}) {
    _.extend(selector, { roles: { $in: [this.Roles.ASSISTANT]}} );
    return this.find(selector);
  },

  findCustomers(selector={}) {
    _.extend(selector, { roles: { $in: [this.Roles.CUSTOMER]}} );
    return Meteor.users.find(selector, {
      transform : function(doc) {
        return _.extend(doc, Customer, User);
      }
    });
  },

  find(selector) {
    return Meteor.users.find(selector, { transform: function(doc) {
      return _.extend(doc, User);
    }} );
  },

  findOne(selector) {
    return Meteor.users.findOne(selector, {transform: function(doc) {
      return _.extend(doc, User);
    }});
  }
}

User = {
  displayName() {
    return this.profile.firstname + " " + this.profile.lastname;
  },
  displayNameWithInitial() {
    return this.profile.firstname + " " + this.profile.lastname[0] + ".";
  }
};
