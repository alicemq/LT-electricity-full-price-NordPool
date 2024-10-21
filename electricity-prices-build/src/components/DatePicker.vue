Vue.component('date-picker', function() {
    template: '<input/>',
    mounted: function() {
      $(this.$el).datepicker();
    }
  });