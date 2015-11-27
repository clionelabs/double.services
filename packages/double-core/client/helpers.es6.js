
Template.registerHelper("formatDate", DateFormatter.toDateString);
Template.registerHelper("formatDateTime", DateFormatter.toDateTimeString);
Template.registerHelper("formatDateMonth", DateFormatter.toDateMonthString);
Template.registerHelper('formatDateShortMonth', DateFormatter.toDateShortMonthString);
Template.registerHelper("formatDurationToMinute", DurationFormatter.toMinute);
Template.registerHelper("formatDuration", DurationFormatter.toString);
Template.registerHelper("formatDurationPrecise", DurationFormatter.toPreciseString);
Template.registerHelper("formatDurationPreciseMs", DurationFormatter.toPreciseMsString);

Template.registerHelper("formatAmount", AmountFormatter.toString);

Template.registerHelper('not', function(x) {
  return !x;
});
