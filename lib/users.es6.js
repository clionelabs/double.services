/*/
 * TODO: refactor double.core to include Users
 * Right now the admin users are shared among different apps, e.g. double dashboard and double services
 * and this piece of code is duplicated in multiple apps
 */
Users = {
  Roles: {
    ADMIN: 'admin'
  },

  isAdmin(userId) {
    return Roles.userIsInRole(userId, [this.Roles.ADMIN]);
  },

  createAdmin(options) {
    let userId = Accounts.createUser(options);
    Roles.addUsersToRoles(userId, this.Roles.ADMIN);
    return userId;
  }
}
