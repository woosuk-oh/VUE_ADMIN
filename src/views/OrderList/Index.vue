<template>
  <!--  <head>
    <meta charset="utf-8">
    <title>Vue Bootstrap Table</title>
    <meta
      name="viewport"
      content="initial-scale=1, maximum-scale=1, user-scalable=no">
    <link
      rel="stylesheet"
      href="examples/app.css">
    <link
      rel="stylesheet"
      href="./node_modules/bootstrap/dist/css/bootstrap.min.css">
  </head>-->
  <body>
    <!--     <style>
    .colstyletest {
      background-color: #000066;
    }

    .cellstyletest {
      background-color: #a94442;
    }
  </style>-->

    <div class="container-fluid">
      <h1>Vue Bootstrap Table</h1>
      <div id="app">
        <div class="row">
          <div class="col-sm-12">
            <button
              class="btn btn-primary"
              @click="addItem"><i class="glyphicon glyphicon-plus-sign"/> Add an item
            </button>
            <button
              class="btn btn-default"
              @click="toggleFilter">Toggle Filter</button>
            <button
              class="btn btn-default"
              @click="togglePicker">Toggle Column Picker</button>
            <button
              class="btn btn-default"
              @click="togglePagination">Toggle Pagination</button>
            <button
              class="btn btn-default"
              @click="refreshTable">Refresh</button>
            <button
              class="btn btn-default"
              @click="setNewPageSize">Page Size = 1</button>
          </div>
          <br><br>
          <vue-bootstrap-table
            ref="exampleTable"
            :columns="columns"
            :values="values"
            :show-filter="showFilter"
            :show-column-picker="showPicker"
            :paginated="paginated"
            :multi-column-sortable="multiColumnSortable"
            :ajax="ajax"
            :row-click-handler="handleRowFunction"
            :filter-case-sensitive="false"
          />
        </div>
        <!--   <h2>Events Received</h2>
        <div>
          {{ logging }}
        </div>-->
      </div>
    </div>
  </body>
</template>

<script>
import VLayout from '@/layouts/Default.vue';
import VCard from '@/components/Card.vue';
import VueBootstrapTable from '@/components/VueBootstrapTable.vue';

const handleRow = function (event, entry) {
  console.log(`CLICK ROW: ${JSON.stringify(entry)}`);
};

export default {
  el: '#app',
  name: 'OrderListIndex',

  /**
     * The components that the page can use.
     */
  components: {
    VLayout,
    VCard,
    VueBootstrapTable,
  },
  data() {
    return {
      logging: [],
      showFilter: true,
      showPicker: true,
      paginated: true,
      multiColumnSortable: true,
      handleRowFunction: handleRow,
      columnToSortBy: 'name',
      ajax: {
        enabled: false,
        url: 'http://172.16.213.1:9430/data/test',
        method: 'POST',
        delegate: true,
      },
      columns: [
        {
          title: 'Id',
          name: 'id',
        },
        {
          title: 'Name',
          name: 'name',
          filterable: false,
        },
        {
          title: 'Description',
          name: 'description',
        },
        {
          title: 'Street Address',
          name: 'street_address',
        },
        {
          title: 'City',
          name: 'city',
        },
        {
          title: 'State',
          name: 'state_province',
        },
        {
          title: 'Postal Code',
          name: 'postal_code',
        },
      ],
      values: [
        {
          id: '111',
          name: 'Casper Cliff',
          description: 'Id est rem aliquam animi libero minima. Praesentium ad cum autem quo voluptatum autem ea. Non rerum aliquam atque minima et. Omnis maiores debitis odio consequatur officiis.',
          created_by: 3,
          street_address: '90947 Schaefer Ramp',
          city: 'Lake Jammiemouth',
          state_province: 'Alaska',
          postal_code: '35070',
          status: 'open',
        },
        {
          id: '0D7D9DB64C7946E0B3FBDDFC',
          name: 'Alfredo Shore',
          description: 'Beatae deserunt aut voluptas modi repudiandae sit animi. Minima sit quam eligendi non aliquid et excepturi. Fugit reiciendis illo illum eum quidem minus.',
          created_by: 4,
          street_address: '1943 Ericka Shoal Suite 196',
          city: 'Johnathanshire',
          state_province: 'Georgia',
          postal_code: '87106',
          status: 'open',
        },
      ],
    };
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
    refreshTable() {
      this.$refs.exampleTable.refresh();
    },
    setNewPageSize() {
      this.$refs.exampleTable.setPageSize(1);
    },
    addItem() {
      // const self = this;
      const item = {
        id: this.values.length + 1,
        name: `name ${this.values.length + 1}`,
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
};
</script>

<style scoped>

</style>
