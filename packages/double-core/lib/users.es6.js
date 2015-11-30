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

  findAssistants(selector={}, options={}) {
    if (typeof selector === 'string' || selector instanceof String) selector = { _id : selector };
    selector = _.extend({}, selector, { roles: { $in: [this.Roles.ASSISTANT]}} );
    return this.find(selector, options);
  },

  findCustomers(selector={}, options={}) {
    if (typeof selector === 'string' || selector instanceof String) selector = { _id : selector };
    selector = _.extend({}, selector, { roles: { $in: [this.Roles.CUSTOMER]}} );
    return this.find(selector, options);
  },

  findOneAssistant(selector={}, options={}) {
    if (typeof selector === 'string' || selector instanceof String) selector = { _id : selector };
    selector = _.extend({}, selector, { roles: { $in: [this.Roles.ASSISTANT]}} );
    return this.findOne(selector, options);
  },

  findOneCustomer(selector={}, options={}) {
    if (typeof selector === 'string' || selector instanceof String) selector = { _id : selector };
    selector = _.extend({}, selector, { roles: { $in: [this.Roles.CUSTOMER]}} );
    return this.findOne(selector, options);
  },

  find(selector={}, options={}) {
    let extendedOptions = _.extend({transform: function(doc) {
      return _.extend(doc, D.User);
    }}, options);
    return Meteor.users.find(selector, extendedOptions);
  },

  findOne(selector={}, options={}) {
    let extendedOptions = _.extend({transform: function(doc) {
      return _.extend(doc, D.User);
    }}, options);
    return Meteor.users.findOne(selector, extendedOptions);
  },
  showDisplayOnlyOptions() {
    return {
      profile : 1,
      'payment.isAuthorized' : 1,
      'roles' : 1
    }
  }
};

D.User = {
  firstName() {
    return this.profile.firstname;
  },
  displayName() {
    return this.profile.firstname + " " + this.profile.lastname;
  },
  displayNameWithInitial() {
    return this.profile.firstname + " " + this.profile.lastname[0] + ".";
  },
  hasPaymentMethod() {
    return this.payment && this.payment.isAuthorized;
  }
};
