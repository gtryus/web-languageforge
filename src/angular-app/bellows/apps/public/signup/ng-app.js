'use strict';

// based on http://scotch.io/tutorials/javascript/angularjs-multi-step-form-using-ui-router
// also http://www.ng-newsletter.com/posts/angular-ui-router.html

// Declare app level module which depends on filters, and services
angular.module('signup', ['bellows.services', 'ui.bootstrap', 'ngAnimate', 'ui.router', 'pascalprecht.translate'])
.config(['$stateProvider', '$urlRouterProvider', '$translateProvider', 
         function($stateProvider, $urlRouterProvider, $translateProvider) {
	
	$stateProvider
		// route to show our basic form (/form)
		.state('form', {
			abstract: true,
			url: '/form',
			templateUrl: '/angular-app/bellows/apps/public/signup/views/form.html',
			controller: 'SignupCtrl'
		})
		
		// nested states 
		// each of these sections have their own view
		// url will be nested (/form/identify)
		.state('form.identify', {
			url: '/identify',
			templateUrl: '/angular-app/bellows/apps/public/signup/views/form-identify.html'
		})
		
		// url will be /form/register
		.state('form.register', {
			url: '/register',
			templateUrl: '/angular-app/bellows/apps/public/signup/views/form-register.html'
		})
		
		// url will be /validate
		.state('validate', {
			url: '/validate',
			templateUrl: '/angular-app/bellows/apps/public/signup/views/validate.html'
		})
	;
	
	// catch all route
	// send users to the form page 
	$urlRouterProvider.otherwise('/form/identify');
	
	// configure interface language filepath
	$translateProvider.useStaticFilesLoader({
		prefix: '/angular-app/languageforge/lexicon/lang/',
		suffix: '.json'
	});
	$translateProvider.preferredLanguage('en');
}])
.controller('SignupCtrl', ['$scope', '$state', 'userService', 'sessionService', 'silNoticeService',  
                           function($scope, $state, userService, sessionService, notice) {
	$scope.showPassword = false;
	$scope.record = {};
	$scope.record.id = '';
	$scope.captchaSrc = '';
	$scope.currentState = $state.current;
	
	$scope.getCaptchaSrc = function() {
		sessionService.getCaptchaSrc(function(result) {
			if (result.ok) {
				$scope.captchaSrc = result.data;
				$scope.record.captcha = "";
			}
		});
	};
	
	$scope.processForm = function() {
		switch ($state.current.name) {
			case 'form.identify':
				$scope.checkIdentity(function(){
					if ($scope.usernameOk) {
						$state.go('form.register');
						$scope.getCaptchaSrc();
					}
					
				});
				break;
			case 'form.register':
				$scope.createUser();
				break;
			default:
				break;
		}
	};
	
	$scope.createUser = function() {
		$scope.submissionInProgress = true;
		userService.register($scope.record, function(result) {
			$scope.submissionInProgress = false;
			if (result.ok) {
				if (!result.data) {
					notice.push(notice.WARN, "The image verification failed.  Please try again");
					$scope.getCaptchaSrc();
				} else {
					$scope.submissionComplete = true;
					//notice.push(notice.SUCCESS, "Thank you for signing up.  We've sent you an email to confirm your registration. Please click the link in the email to activate your account.  If you don't see your activation email, check your email's SPAM folder.");
				}
			}
		});
		return true;
	};
	
	$scope.checkIdentity = function(callback) {
		$scope.usernameOk = false;
		$scope.usernameExists = false;
		if ($scope.record.username) {
			$scope.usernameLoading = true;
			if (! $scope.record.email) {
				$scope.record.email = '';
			}
			userService.identityExists($scope.record.username, $scope.record.email, function(result) {
				$scope.usernameLoading = false;
				if (result.ok) {
					if (result.data.usernameExists) {
						$scope.usernameOk = false;
						$scope.usernameExists = true;
					} else {
						$scope.usernameOk = true;
						$scope.usernameExists = false;
					}
				}
				(callback || angular.noop)();
			});
		}
	};
	
}])
;
