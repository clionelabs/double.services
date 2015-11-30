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
  api.use('momentjs:moment');
  api.use('numeral:numeral');
  api.use('oaf:moment-duration-format');
  api.use('fourseven:scss');
  api.use('templating', [
    'client'
  ]);
  api.addFiles([
    'lib/helpers.es6.js',
    'lib/_d.es6.js',
    'lib/channels.es6.js',
    'lib/messages.es6.js',
    'lib/configs.es6.js',
    'lib/users.es6.js',
    'lib/placements.es6.js',
    'lib/events.es6.js',
    'lib/invoices.es6.js'
  ]);
  api.addFiles([
    'client/helpers.es6.js',
    'client/variables.scss',
    'client/invoices/actual_form.scss',
    'client/invoices/actual_form_membership.html',
    'client/invoices/actual_form_other_charge.html',
    'client/invoices/actual_form_time_based_item.html',
    'client/invoices/actual_form.html',
    'client/invoices/actual_form.es6.js'
  ], ['client']);
  api.export('D');
  api.export('DateFormatter');
  api.export('DurationFormatter');
  api.export('AmountFormatter');
  api.export('DurationConverter');
});
