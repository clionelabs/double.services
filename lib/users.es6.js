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
  }
}
