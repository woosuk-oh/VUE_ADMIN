// Vue.config.debug = true;
// Vue.config.devtools = true;

new Vue({
  el: '#app',
  components: {
    VueBootstrapTable,
  },
  data: {
    logging: [],
    showFilter: true,
    showPicker: true,
    paginated: true,
    multiColumnSortable: true,
    ajax: {
      enabled: false,
      url: 'http://localhost:9430/data/test',
      method: 'POST',
      delegate: true,
    },
    columns: [
      {
        title: 'id',
        visible: true,
        editable: false,
      },
      {
        title: 'Name',
        name: 'name',
        visible: true,
        editable: true,
      },
      {
        title: 'Age',
        name: 'age',
        visible: true,
        editable: true,
      },
      {
        title: 'Country',
        name: 'country',
        visible: true,
        editable: true,
      },
    ],
    values: [
      {
        id: 1,
        name: 'John',
        country: 'UK',
        age: 25,
      },
      {
        id: 2,
        name: 'Mary',
        country: 'France',
        age: 30,
      },
      {
        id: 3,
        name: 'Ana',
        country: 'Portugal',
        age: 20,
      },
    ],
  },
  created() {
    const self = this;
    this.$on(
      'cellDataModifiedEvent',
      (originalValue, newValue, columnTitle, entry) => {
        self.logging.push(`cellDataModifiedEvent - Original Value : ${originalValue
        } | New Value : ${newValue
        } | Column : ${columnTitle
        } | Complete Entry : ${entry}`);
      },
    );
    this.$on(
      'ajaxLoadedEvent',
      function (data) {
        this.logging.push(`ajaxLoadedEvent - data : ${data}`);
      },
    );
    this.$on(
      'ajaxLoadingError',
      function (error) {
        this.logging.push(`ajaxLoadingError - error : ${error}`);
      },
    );
  },
  methods: {
    addItem() {
      const self = this;
      const item = {
        id: this.values.length + 1,
        name: `name ${this.values.length + 1}`,
        country: 'Portugal',
        age: 26,
      };
      this.values.push(item);
    },
    toggleFilter() {
      this.showFilter = !this.showFilter;
    },
    togglePicker() {
      this.showPicker = !this.showPicker;
    },
    togglePagination() {
      this.paginated = !this.paginated;
    },
  },
});
