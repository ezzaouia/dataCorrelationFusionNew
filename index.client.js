(function () {
    'use strict';
    
    angular
        .module('myAPP', ['ng', 'ngMaterial', 'ngMdIcons', 'filters.client', 'services.client', 'directives.client', 'controllers.client', 'md.data.table', 'n3-line-chart', 'ngFileSaver'])
        .constant('TNthreshold', 10)
        .constant('TPthreshold', 30);
})();




