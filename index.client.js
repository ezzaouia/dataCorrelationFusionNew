(function () {
    'use strict';
    
    angular
        .module('myAPP', ['ng', 'ngMaterial', 'ngMdIcons', 'filters.client', 'services.client', 'directives.client', 'controllers.client', 'md.data.table', 'n3-line-chart', 'ngFileSaver', 'n3-pie-chart'])
        .constant('TNthreshold', 15)
        .constant('TPthreshold', 20);
})();




