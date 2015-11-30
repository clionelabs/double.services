DateFormatter = {
  toDateString : (date) => {
    return date ? moment(date).format('YYYY-MM-DD') : '---';
  },
  toDateTimeString : (date) => {
    return  date ? moment(date).format('YYYY-MM-DD HH:mm:ss') : '---';
  },
  toDateMonthString : (date) => {
    return  date ? moment(date).format('MMMM DD, YYYY') : '---';
  },
  toDateShortMonthString : (date) => {
    return  date ? moment(date).format('MMM DD, YYYY') : '---';
  }
};

DurationFormatter = {
  toMinute : (duration) => {
    return duration / 1000 / 60;
  },
  toString : (duration)=> {
    return duration ? moment.duration(duration).humanize(true) : '---';
  },
  toPreciseString : (duration) => {
    return moment.duration(duration).format('hh:mm:ss', { trim : false });
  },
  toPreciseMsString : function(duration) {
    return moment.duration(duration).format('hh:mm:ss.SSS', { trim : false });
  }
};

DurationConverter = {
  minutesToMs : (minute) => {
    return minute * 60 * 1000;
  }
};

AmountFormatter = {
  toString : function(amount) {
    return numeral(amount).format('0,0.00');
  }
};
