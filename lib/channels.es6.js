/**
 * @property {String} category Category of channels, e.g. SLACK, SMS, EMAIL
 * @property {String} meta Meta data to identify the channel; Different formats for different categories
 * @property {String} customerId
 */
D.Channels = new Meteor.Collection("d-channels", {
  transform: (doc) => {
    return _.extend(doc, D.Channel);
  }
});

D.Channels.Categories = {
  SLACK: 'SLACK'
}

D.Channel = {

}
