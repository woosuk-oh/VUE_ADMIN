<template>
  <div
    id="maindiv"
    @click="closeDropdown"
    @keyup.esc="closeDropdown">
    <!--<pre>{{columns}}</pre>-->
    <!--<pre>{{$data}}</pre>-->
    <div class="col-sm-6">
      <div
        v-if="showFilter"
        style="padding-top: 10px;padding-bottom: 10px;">
        <div class="input-group">
          <input
            v-model="filterKey"
            type="text"
            class="form-control"
            placeholder="Filter">
          <div class="input-group-addon">
            <i class="glyphicon glyphicon-search"/>
          </div>
        </div>
      </div>
    </div>
    <div class="col-sm-6">
      <div
        v-if="showColumnPicker"
        style="padding-top: 10px;padding-bottom: 10px;float:right;">
        <div
          :class="{'open' : columnMenuOpen}"
          class="btn-group">
          <button
            type="button"
            class="btn btn-default dropdown-toggle"
            data-toggle="dropdown"
            aria-haspopup="true"
            @click.stop.prevent="columnMenuOpen = !columnMenuOpen"
            @keyup.esc="columnMenuOpen = false">
            Columns <span class="caret"/>
          </button>
          <ul class="dropdown-menu">
            <li v-for="column in displayCols">
              <a
                href="#"
                @click.stop.prevent="toggleColumn(column)">
                <i
                  v-if="column.visible"
                  class="glyphicon glyphicon-ok"/> {{ column.title }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="col-sm-12">
      <div
        id="loadingdiv"
        :class="{'vue-table-loading': this.loading , 'vue-table-loading-hidden': !this.loading}">
        <div class="spinner"/>
      </div>
      <table class="table table-bordered table-hover table-condensed table-striped vue-table">
        <thead>
          <tr>
            <th
              v-for="column in displayColsVisible"
              :class="getClasses(column)"
              track-by="column"
              @click="sortBy($event, column.name, column.sortable)">
              {{ column.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in filteredValuesSorted "
            track-by="entry"
            @click="rowClickHandler($event, entry)">
            <td
              v-for="column in displayColsVisible"
              v-show="column.visible"
              :class="column.cellstyle"
              track-by="column">
              <span
                v-if="column.renderfunction!==false"
                v-html="column.renderfunction( column.name, entry )"/>
              <span v-else-if="!column.editable"> {{ entry[column.name] }} </span>
              <value-field-section
                v-else
                :entry="entry"
                :columnname="column.name"/>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div
      v-if="paginated"
      class="col-sm-12">
      <div
        class="btn-toolbar"
        role="toolbar"
        aria-label="pagination bar">
        <div
          class="btn-group"
          role="group"
          aria-label="first page">
          <button
            type="button"
            class="btn btn-default"
            @click="page=1">&laquo;</button>
        </div>
        <div
          class="btn-group"
          role="group"
          aria-label="pages">
          <button
            v-for="index in validPageNumbers"
            :class="{ active: page===index }"
            type="button"
            class="btn btn-default"
            @click="page=index">
            {{ index }}
          </button>
        </div>
        <div
          v-if="showPaginationEtc"
          class="btn-group">...</div>
        <div
          class="btn-group"
          role="group"
          aria-label="last page">
          <button
            type="button"
            class="btn btn-default"
            @click="page=maxPage">&raquo;</button>
        </div>
      </div>
    </div>
  </div>
</template>
<style>
    .vue-table {

    }

    /*#maindiv {
        content: " ";
        box-sizing: border-box;
        display:
        table; width: 100%;
    }
*/
    .vue-table-loading .spinner {
        border: 16px solid #f3f3f3; /* Light grey */
        border-top: 16px solid #3498db; /* Blue */
        border-radius: 50%;
        width: 120px;
        height: 120px;
        animation: spin 2s linear infinite;
        position: absolute;
        left: 50%;
        top: 50%;
        margin: -60px 0 0 -60px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }


    .vue-table-loading{
        position: absolute;
        z-index: 99;
        background-color: #ddd;
        opacity: 0.5;
        width: 100%;
        height: 100%;
    }

    .vue-table-loading-hidden {
        display: none;
    }

    table.vue-table thead > tr > th {
        cursor: pointer;
        padding-right: 30px !important;
    }

    /*.vue-table th.active {
        color: red;
    }*/

    .vue-table .arrow {
        opacity: 1;
        position: relative;
    }

    .vue-table .arrow:after {
        position: absolute;
        bottom: 8px;
        right: 8px;
        display: block;
        font-family: 'Glyphicons Halflings';
        content: "\e150";
        /*
        display: inline-block;
        vertical-align: middle;
        width: 0;
        height: 0;
        margin-left: 5px;
        opacity: 0.66;*/
    }

    .vue-table .arrow.asc:after {
        content: "\e155";
        /*
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-bottom: 4px solid #000;
        */
    }

    .vue-table .arrow.dsc:after {
        content: "\e156";
    }


    .vue-table .editableField {
        cursor:pointer;
    }

    /*.vue-table .selected-cell {
        background-color: #F7C072;
    }

    .vue-table .selected-row {
        background-color: #FAE1BE !important;
    }*/
</style>
<script>

/* used for fixing IE problems */
import { polyfill } from 'es6-promise';
import axios from 'axios';
import qs from 'qs';
import lodashorderby from 'lodash.orderby';
import lodashincludes from 'lodash.includes';
import lodashfindindex from 'lodash.findindex';

polyfill();


/* Field Section used for displaying and editing value of cell */
const valueFieldSection = {
  template: '<span v-if="!enabled" @dblclick="toggleInput" class="editableField">{{this.entry[this.columnname]}}</span>' +
          '<div v-else-if="enabled" class="input-group">' +
          '  <input type="text" class="form-control" v-model="datavalue" @keyup.enter="saveThis" @keyup.esc="cancelThis">' +
          '  <span class="input-group-btn">' +
          '    <button class="btn btn-danger" type="button" @click="cancelThis" ><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>' +
          '    <button class="btn btn-primary" type="button" @click="saveThis" ><span class="glyphicon glyphicon-ok" aria-hidden="true"></span></button>' +
          '  </span>' +
          '</div>',
  props: ['entry', 'columnname'],
  data() {
    return {
      enabled: false,
      datavalue: '',
    };
  },
  methods: {
    saveThis() {
      const originalValue = this.entry[this.columnname];
      this.entry[this.columnname] = this.datavalue;
      this.$parent.$emit('cellDataModifiedEvent', originalValue, this.datavalue, this.columnname, this.entry);
      this.enabled = !this.enabled;
    },
    cancelThis() {
      this.datavalue = this.entry[this.columnname];
      this.enabled = !this.enabled;
    },
    toggleInput() {
      this.datavalue = this.entry[this.columnname];
      this.enabled = !this.enabled;
    },
  },
};

export default {
  name: 'VueBootstrapTable',
  components: {
    'value-field-section': valueFieldSection,
  },
  props: {
    /**
             * The column titles, required
             */
    columns: {
      type: Array,
      required: true,
    },
    /**
             * The rows, an Array of objects
             */
    values: {
      type: Array,
      required: false,
    },
    /**
             * Enable/disable table sorting, optional, default true
             */
    sortable: {
      type: Boolean,
      required: false,
      default: true,
    },
    /**
             * Enable/disable table multicolumn sorting, optional, default false.
             * Also sortable must be enabled for this function to work.
             */
    multiColumnSortable: {
      type: Boolean,
      required: false,
      default: false,
    },
    /**
             * Enable/disable input filter, optional, default false
             */
    showFilter: {
      type: Boolean,
      required: false,
      default: false,
    },
    /**
             * Define if Filter search field is to work in a case Sensitive way. Default: true
             */
    filterCaseSensitive: {
      type: Boolean,
      required: false,
      default: true,
    },
    /**
             * Enable/disable column picker to show/hide table columns, optional, default false
             */
    showColumnPicker: {
      type: Boolean,
      required: false,
      default: false,
    },
    /**
             * Enable/disable pagination for the table, optional, default false
             */
    paginated: {
      type: Boolean,
      required: false,
      default: false,
    },
    /**
             * If pagination is enabled defining the page size, optional, default 10
             */
    pageSize: {
      type: Number,
      required: false,
      default: 10,
    },
    /**
             * Setting default order column. Expected name of the column
             */
    defaultOrderColumn: {
      type: String,
      required: false,
      default: null,
    },
    /**
             * Setting default order direction. Boolean: true = ASC , false = DESC
             */
    defaultOrderDirection: {
      type: Boolean,
      required: false,
      default: true,
    },
    /**
             * If loading of table is to be done through ajax, then this object must be set
             */
    ajax: {
      type: Object,
      required: false,
      default() {
        return {
          enabled: false,
          url: '',
          method: 'GET',
          delegate: false,
          axiosConfig: {},
        };
      },
    },
    /**
             * Function to handle row clicks
             */
    rowClickHandler: {
      type: Function,
      required: false,
      default() {},
    },
  },
  data() {
    return {
      filteredSize: 0,
      filterKey: '',
      sortKey: [],
      sortOrders: {},
      sortChanged: 1,
      columnMenuOpen: false,
      displayCols: [],
      filteredValues: [],
      rawValues: [],
      page: 1,
      definedPageSize: 10,
      echo: 0,
      loading: false,
    };
  },
  computed: {
    displayColsVisible() {
      const displayColsVisible = [];
      for (const a in this.displayCols) {
        if (this.displayCols[a].visible) { displayColsVisible.push(this.displayCols[a]); }
      }
      return displayColsVisible;
    },
    filteredValuesSorted() {
      const tColsDir = [];
      for (let i = 0, len = this.sortKey.length; i < len; i++) {
        tColsDir.push(this.sortOrders[this.sortKey[i]].toLowerCase());
      }
      if (typeof this.ajax !== 'undefined' && this.ajax.enabled && this.ajax.delegate) {
        return this.filteredValues;
      }
      return lodashorderby(this.filteredValues, this.sortKey, tColsDir);
    },
    validPageNumbers() {
      // 5 page max
      const result = [];
      let start = 1;
      if (this.page > 3) { start = this.page - 2; }
      for (let i = 0; start <= this.maxPage && i < 5; start++) {
        result.push(start);
        i++;
      }
      return result;
    },
    maxPage() {
      return Math.ceil(this.filteredSize / this.definedPageSize);
    },
    showPaginationEtc() {
      let temp = 1;
      if (this.page > 3) { temp = this.page - 2; }
      return ((temp + 4) < this.maxPage);
    },
  },
  watch: {
    rawValues() {
      this.processFilter();
    },
    columns() {
      this.displayCols = [];
      const self = this;
      this.columns.forEach((column) => {
        const obj = self.buildColumnObject(column);
        self.displayCols.push(obj);
      });
      this.setSortOrders();
    },
    showFilter() {
      this.filterKey = '';
    },
    showColumnPicker() {
      this.columnMenuOpen = false;

      this.displayCols.forEach((column) => {
        column.visible = true;
      });
    },
    filterKey() {
      // filter was updated, so resetting to page 1
      this.page = 1;
      this.processFilter();
    },
    sortKey() {
      this.processFilter();
    },
    sortChanged() {
      this.processFilter();
    },
    page() {
      this.processFilter();
    },
    paginated() {
      this.processFilter();
    },
    loading() {
      /* document.getElementById("loadingdiv").style.width = document.getElementById("maindiv").getBoundingClientRect().width + "px";
                document.getElementById("loadingdiv").style.height = document.getElementById("maindiv").getBoundingClientRect().height+"px"; */
    },
  },
  /**
         * Once mounted and ready to start
         */
  mounted() {
    this.$nextTick(function () {
      this.loading = true;
      this.setSortOrders();
      this.definedPageSize = this.pageSize;
      const self = this;
      //
      if (this.defaultOrderColumn !== null) {
        console.log('setting order default');
        self.sortKey[0] = this.defaultOrderColumn;
        if (this.defaultOrderDirection) { self.sortOrders[this.defaultOrderColumn] = 'ASC'; } else { self.sortOrders[this.defaultOrderColumn] = 'DESC'; }
      }
      // Build columns
      this.columns.forEach((column) => {
        const obj = self.buildColumnObject(column);
        self.displayCols.push(obj);
      });
      // Work the data
      if (this.ajax.enabled) {
        if (!this.ajax.delegate) {
          // If ajax but NOT delegate
          // Perform the fetch of data now and set the raw values
          this.loading = true;
          this.fetchData((data) => {
            self.rawValues = data.data;
          });
        } else {
          // If ajax and also delegate
          // Simply call processFilter, which will take care of the fetching
          // this.processFilter();
        }
      } else {
        // Not ajax, therefore working with given elements
        // Pass the Prop values to rawValues data object.
        self.rawValues = self.values;
      }
    });
  },
  /**
         * On created register on CellDataModified event
         */
  created() {
    const self = this;
    this.$on('cellDataModifiedEvent', self.fireCellDataModifiedEvent);
  },
  /**
         * On destroy unregister the event
         */
  beforeDestroy() {
    const self = this;
    this.$off('cellDataModifiedEvent', self.fireCellDataModifiedEvent);
  },
  methods: {
    refresh() {
      this.processFilter();
    },
    setPageSize(newPageSize) {
      this.definedPageSize = newPageSize;
      this.processFilter();
    },
    /**
             * Used to fire off events when something happens to a cell
             */
    fireCellDataModifiedEvent(originalValue, newValue, columnTitle, entry) {
      this.$parent.$emit('cellDataModifiedEvent', originalValue, newValue, columnTitle, entry);
    },
    processFilter() {
      const self = this;
      this.loading = true;
      if (this.ajax.enabled && this.ajax.delegate) {
        this.fetchData((data) => {
          self.filteredSize = data.filtered;
          self.filteredValues = data.data;
          self.loading = false;
        });
      } else {
        let result = this.rawValues.filter((item) => {
          for (const col in self.displayColsVisible) {
            if (self.displayColsVisible[col].filterable) {
              if (self.filterCaseSensitive) {
                if (lodashincludes(`${item[self.displayColsVisible[col].name]}`, `${self.filterKey}`)) {
                  return true;
                }
              } else if (lodashincludes((`${item[self.displayColsVisible[col].name]}`).toLowerCase(), (`${self.filterKey}`).toLowerCase())) {
                return true;
              }
            }
          }
          return false;
        });

        const tColsDir = [];
        for (let i = 0, len = this.sortKey.length; i < len; i++) {
          tColsDir.push(this.sortOrders[this.sortKey[i]].toLowerCase());
        }

        if (typeof this.ajax !== 'undefined' && this.ajax.enabled && this.ajax.delegate) {} else {
          result = lodashorderby(result, this.sortKey, tColsDir);
        }

        this.filteredSize = result.length;
        if (this.paginated) {
          const startIndex = (this.page - 1) * this.definedPageSize;
          let tIndex = 0;
          const tempResult = [];
          while (tIndex < this.definedPageSize) {
            if (typeof result[startIndex + tIndex] !== 'undefined') { tempResult.push(result[startIndex + tIndex]); }
            tIndex++;
          }
          self.filteredValues = tempResult;
        } else { self.filteredValues = result; }
        self.loading = false;
      }
    },
    fetchData(dataCallBackFunction) {
      const self = this;
      let ajaxParameters = {
        params: {},
      };
      this.echo++;
      if (this.ajax.enabled && this.ajax.delegate) {
        const tColsDir = [];
        for (let i = 0, len = this.sortKey.length; i < len; i++) {
          tColsDir.push(this.sortOrders[this.sortKey[i]].toLowerCase());
        }
        if (this.ajax.method === 'GET') {
          // COPY
          if (this.ajax !== null && this.ajax.axiosConfig !== null && this.ajax.axiosConfig !== undefined) {
            ajaxParameters = JSON.parse(JSON.stringify(this.ajax.axiosConfig));
          }
          ajaxParameters.params = {};
          ajaxParameters.params.sortcol = this.sortKey;
          ajaxParameters.params.sortdir = tColsDir;
          ajaxParameters.params.filter = this.filterKey;
          if (self.paginated) {
            ajaxParameters.params.page = this.page;
            ajaxParameters.params.pagesize = this.definedPageSize;
          } else {
            ajaxParameters.params.page = 1;
            ajaxParameters.params.pagesize = null;
          }
          ajaxParameters.params.echo = this.echo;
        }
        if (this.ajax.method === 'POST') {
          ajaxParameters.sortcol = this.sortKey;
          ajaxParameters.sortdir = tColsDir;
          ajaxParameters.filter = this.filterKey;
          if (self.paginated) {
            ajaxParameters.page = this.page;
            ajaxParameters.pagesize = this.definedPageSize;
          } else {
            ajaxParameters.page = 1;
            ajaxParameters.pagesize = null;
          }
          ajaxParameters.echo = this.echo;
        }
        // console.log(JSON.stringify(ajaxParameters));
      }
      if (this.ajax.enabled && !this.ajax.delegate) {
        if (this.ajax.method === 'GET') {
          // COPY
          if (this.ajax !== null && this.ajax.axiosConfig !== null && this.ajax.axiosConfig !== undefined) {
            ajaxParameters = JSON.parse(JSON.stringify(this.ajax.axiosConfig));
          }
          ajaxParameters.params = {};
        }
        if (this.ajax.method === 'POST') {
          // Do nothing at this point !
        }
      }
      if (this.ajax.enabled && this.ajax.method === 'GET') {
        axios.get(self.ajax.url, ajaxParameters)
          .then((response) => {
            if (this.ajax.delegate) {
              if (response.data.echo !== self.echo) {
                return;
              }
            }
            dataCallBackFunction(response.data);
            this.$parent.$emit('ajaxLoadedEvent', response.data);
          })
          .catch((e) => {
            this.$parent.$emit('ajaxLoadingError', e);
          });
      }
      if (this.ajax.enabled && this.ajax.method === 'POST') {
        let tempAxiosConf = {};
        if (this.ajax !== null && this.ajax.axiosConfig !== null && this.ajax.axiosConfig !== undefined) {
          tempAxiosConf = this.ajax.axiosConfig;
        }
        axios.post(self.ajax.url, qs.stringify(ajaxParameters), tempAxiosConf)
          .then((response) => {
            if (this.ajax.delegate) {
              if (response.data.echo !== self.echo) {
                return;
              }
            }

            dataCallBackFunction(response.data);
            this.$parent.$emit('ajaxLoadedEvent', response.data);
          })
          .catch((e) => {
            this.$parent.$emit('ajaxLoadingError', e);
          });
      }
    },
    buildColumnObject(column) {
      const obj = {};
      obj.title = column.title;
      if (typeof column.name !== 'undefined') { obj.name = column.name; } else { obj.name = column.title; }
      if (typeof column.visible !== 'undefined') { obj.visible = column.visible; } else { obj.visible = true; }
      if (typeof column.editable !== 'undefined') { obj.editable = column.editable; } else { obj.editable = false; }
      if (typeof column.renderfunction !== 'undefined') { obj.renderfunction = column.renderfunction; } else { obj.renderfunction = false; }
      if (typeof column.columnstyle !== 'undefined') { obj.columnstyle = column.columnstyle; } else { obj.columnstyle = ''; }
      if (typeof column.cellstyle !== 'undefined') { obj.cellstyle = column.cellstyle; } else { obj.cellstyle = ''; }
      if (typeof column.sortable !== 'undefined') { obj.sortable = column.sortable; } else { obj.sortable = true; }
      if (typeof column.filterable !== 'undefined') { obj.filterable = column.filterable; } else { obj.filterable = true; }

      return obj;
    },
    setSortOrders() {
      this.sortKey = [];
      const sortOrders = {};
      this.columns.forEach((column) => {
        sortOrders[column.name] = '';
      });
      this.sortOrders = sortOrders;
    },
    sortBy(event, key, enabled) {
      if (!enabled) { return; }
      if (this.sortable) {
        const self = this;

        if (!this.multiColumnSortable || (this.multiColumnSortable && !event.shiftKey)) {
          this.sortKey = [key];
          this.columns.forEach((column) => {
            if (column.name !== key) {
              self.sortOrders[column.name] = '';
            }
          });
        } else if (lodashfindindex(this.sortKey, o => o === key) === -1) {
          this.sortKey.push(key);
        }
        if (this.sortOrders[key] === '') {
          this.sortOrders[key] = 'ASC';
        } else if (this.sortOrders[key] === 'ASC') {
          this.sortOrders[key] = 'DESC';
        } else {
          this.sortOrders[key] = 'ASC';
        }

        this.sortChanged = this.sortChanged * -1;
      }
    },
    getClasses(column) {
      const classes = [column.columnstyle];
      const key = column.name;
      if (this.sortable && column.sortable) {
        classes.push('arrow');
        /* if (this.sortKey === key) {
                        classes.push("active");
                    } */
        if (lodashfindindex(this.sortKey, o => o === key) !== -1) {
          classes.push('active');
        }

        if (this.sortOrders[key] === 'ASC') {
          classes.push('asc');
        } else if (this.sortOrders[key] === 'DESC') {
          classes.push('dsc');
        }
      }
      return classes;
    },
    toggleColumn(column) {
      column.visible = !column.visible;
    },
    closeDropdown() {
      this.columnMenuOpen = false;
    },
  },
  events: {
  },
};
</script>
