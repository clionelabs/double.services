Template.adminMain.helpers({
  isSlackTabSelected() {
    return Template.instance().selectedTabVar.get() === 'slack';
  },

  isChannelsTabSelected() {
    return Template.instance().selectedTabVar.get() === 'channels';
  },

  isTelegramTabSelected() {
    return Template.instance().selectedTabVar.get() === 'telegram';
  },

  isNotificationTabSelected() {
    return Template.instance().selectedTabVar.get() === 'notification';
  },

  contentTemplateName() {
    let selectedTab = Template.instance().selectedTabVar.get();
    if (selectedTab === 'slack') {
      return 'slackMain';
    } else if (selectedTab === 'channels') {
      return 'channelsMain';
    } else if (selectedTab === 'telegram') {
      return 'telegramMain';
    } else if (selectedTab === 'notification') {
      return 'notificationMain';
    }
  }
});

Template.adminMain.onCreated(function() {
  let instance = Template.instance();
  instance.selectedTabVar = new ReactiveVar('slack');
});

Template.adminMain.events({
  "click .slack-tab": function() {
    Template.instance().selectedTabVar.set("slack");
  },

  "click .channels-tab": function() {
    Template.instance().selectedTabVar.set("channels");
  },

  "click .telegram-tab": function() {
    Template.instance().selectedTabVar.set("telegram");
  },

  "click .notification-tab": function() {
    Template.instance().selectedTabVar.set("notification");
  }
});
