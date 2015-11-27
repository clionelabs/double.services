Template.assistantsInvoiceActualForm.helpers({
  showOtherCharges() {
    return (this.otherCharges && this.otherCharges.length)
              ? "assistantsInvoiceActualFormOtherChargesTable" : "";
  },
  showTimeBasedItems() {
    return (this.timeBasedItems && this.timeBasedItems.length)
        ? "assistantsInvoiceActualFormTimeBasedItemsTable" : "";
  },
  showMemberships() {
    return (this.memberships && this.memberships.length)
      ? "assistantsInvoiceActualFormMembershipsTable" : "";
  },
  debitedOrDue() {
    return this.isCustomerPaymentMethodAvailable ? 'Debited' : 'Due';
  },
  credit() {
    return -1 * (this.credit + (this.creditFromSubscription || 0));
  }
});

Template.assistantsInvoiceActualFormTimeBasedItemsTable.helpers({
  timeBasedItems() {
    const timeBasedItems = this.timeBasedItems;
    return _(timeBasedItems)
            .chain()
            .sortBy('totalDuration')
            .sortBy('updates')
            .sortBy('date')
            .sortBy('title').value();
  }
});

Template.assistantsInvoiceActualFormOtherChargesTable.helpers({
  otherCharges() {
    const otherCharges = this.otherCharges;
    return _(otherCharges)
        .chain()
        .sortBy('requests')
        .sortBy('title')
        .sortBy('amount')
        .sortBy('date').value();
  }
});

Template.assistantsInvoiceActualFormMembershipsTable.helpers({
  memberships() {
    const memberships = this.memberships;
    return _(memberships)
      .chain()
      .sortBy('date').value();
  }
});
