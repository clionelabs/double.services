Handlebars.registerHelper('formatTS', function(ts) {
  if (!ts) return '--';
  return moment(parseInt(ts) * 1000).format('MM-DD HH:mm:ss');
});
