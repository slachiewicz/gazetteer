var app = angular.module('Gazetteer', [ 'ngRoute' ]);

app.config(['$locationProvider', function($locationProvider) {
	$locationProvider.hashPrefix('!');
}]);

app.config(function($routeProvider) {
    $routeProvider
    	.when('/search', {
    		templateUrl: '/static/search.html', 
    		controller:'SearchController', 
    		reloadOnSearch: false });

    $routeProvider
    	.when('/', {redirectTo: '/search'});
    
    $routeProvider.otherwise({
            redirectTo: '/search'
        });
});

app.directive('ngEnter', function() {
	return function(scope, element, attrs) {
		element.bind("keydown keypress", function(event) {
			if (event.which === 13) {
				scope.$apply(function() {
					scope.$eval(attrs.ngEnter);
				});

				event.preventDefault();
			}
		});
	};
});


function SearchController($scope, $http, $location, $routeParams) {

	var controller = this;
	
	$scope.searchForm = {};
	$scope.searchForm.types = {};
	$scope.searchForm.type = [];

	$scope.$watch(function () {return $location.search();}, 
		function() {
			$scope.searchForm.q = $location.search()['q'] || '';
			$scope.searchForm.type = $location.search()['type'] || [];
			$scope.selectedRowId = $location.search()['id'];
			$scope.searchForm.submitForm();
		}
	);
	     
    $scope.$watch('searchForm.q', function(term) {
       $location.search('q', term);
    });

    $scope.$watch('searchForm.type', function(term) {
    	$location.search('type', term);
    	var h = {};
    	if(Array.isArray(term)) {
    		for(i in term) {
    			h[term[i]] = true;
    		}
    	}
    	else if (term) {
    		h[term] = true;
    	}
    	$scope.searchForm.types = h;
    });
	
	$scope.$watch('searchForm.types', function(v) {
		$scope.searchForm.type = [];
		for ( var k in v) {
			if (v[k]) {
				$scope.searchForm.type.push(k);
			}
		}
	}, true);

	$scope.searchForm.submitForm = function() {

		if($scope.searchForm.q) {
			$http.get('/_search', {
				'params' : controller.getParams($scope)
			}).success(function(data) {
				$scope.searchResult = data;
			});
		}

		return false;
	};
	
	$scope.map = L.map('map').setView([47.398, 18.677], 4);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo($scope.map);
	
	$scope.markersMap = {};
	$scope.markers = [];
	
	$scope.$watch('selectedRowId', function(rid) {
		$location.search('id', rid);
		if(rid) {
			var a = rid.split('-');
			var fid = a[0] + '-' + a[1] + '-' + a[2];
			$http.get('/feature', {
				'params':{
					'id': fid,
					'format': 'json'
				}
			}).success(function(data) {
				$scope.feature = data;
				$scope.$broadcast('showFeature', {'fid':data.feature_id, 'rid':$routeParams.rowId});
			});
		}
	}, true);

	$scope.$watch('searchResult', function(results) {
		
		angular.forEach($scope.markers, function(v, k) {
			$scope.map.removeLayer(v);
		});
		
		$scope.markersMap = {};
		$scope.markers = [];
		
		var lls = [];
		if (results) {
			angular.forEach(results.features, function(v, k) {
				if (!(v.center_point.lat == 0 && v.center_point.lon == 0)) {
					
					var m = L.marker([v.center_point.lat, v.center_point.lon]).addTo($scope.map)
				    	.bindPopup($scope.frmtSrchRes(v))
				    	.on('click', function(event){
				    		$scope.selectF(v, event);
				    		$scope.$digest();
				    	});
					
				    m.rid = hashCode(v.id);
					m.fid = hashCode(v.feature_id);
				    	
					$scope.markersMap[hashCode(v.id)] = m;
					$scope.markers.push(m);
					
					if(v.id == $scope.selectedRowId) {
						m.openPopup();
						$scope.map.setView(m.getLatLng(), 17);
					}
					
					lls.push(L.latLng(v.center_point.lat, v.center_point.lon));
				}
			});

			$scope.bounds = L.latLngBounds(lls);
			$scope.map.fitBounds($scope.bounds);
		}
	});
	
	$scope.selectF = function(f, $event) {
		$scope.selectedRowId = f.id;
		if($scope.markersMap[$scope.selectedRowId]) {
			$scope.selectedMarker = $scope.markersMap[$scope.selectedRowId];
			$scope.map.setView($scope.selectedMarker.getLatLng(), 17);
			$scope.selectedMarker.openPopup();
		}
	};

	$scope.frmtSrchRes = function(f) {
		if (f.type == 'adrpnt') {
			return f.address;
		}
		if (f.type == 'poipnt') {
			return f.poi_class_names[0] + ' ' + (f.name || '') + ' (' + f.address + ')';
		}
		return f.name;
	};

}

SearchController.prototype.getParams = function($scope) {
	var params = {};
	angular.extend(params, $scope.searchForm);
	params.types = undefined;
	params.submitForm = undefined;
	return params;
}

function hashCode(str){
	return '' + str;
}