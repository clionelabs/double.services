Package.describe({
  name: 'double-core',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'double core',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/clionelabs/double.core.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.2');
  api.use('alanning:roles');
  api.use('grigio:babel');
  api.use('underscore');
  api.addFiles([
    'lib/_d.es6.js',
    'lib/channels.es6.js',
    'lib/messages.es6.js',
    'lib/configs.es6.js',
    'lib/users.es6.js',
    'lib/placements.es6.js'
  ]);
  api.export('D');
});
