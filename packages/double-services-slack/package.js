Package.describe({
  name: 'double-services-slack',
  version: '0.0.1',
  summary: 'double services slack',
  git: '',
  documentation: ''
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.2');
  api.use('double-core');
  api.addFiles([
    'slack_service.es6.js'
  ]);
  api.export('SlackService');
});
