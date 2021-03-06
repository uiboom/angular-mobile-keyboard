(function(global) {
    var keyboardApp = angular.module("ngMobileKeyboard", []);
    var config = {
        kbId: "virtualKb",
        dev: true
    };
    var activeEvent = "ontouchstart" in window ? "touchstart" : "click";
    function isContains(p, c) {
        while(p != c && c != null) {
            c = c.parentElement;
        }
        return c != null;
    }


    keyboardApp.directive("ngKeyboard", ["$rootScope", "$document", function($rootScope, $document) {
        return {
            restrict: "A",
            link: function(scope, ele, attrs) {
                var kbStr = attrs.ngKeyboard;                    
                var trimPattern = /^\s+|\s+&/;
                var kbTypes = [];
                var targetEle = ele[0];
                ele.attr("readonly", true);


                angular.forEach(kbStr.split(" "), function(kb) {
                    var str = kb.toUpperCase();
                    if(str.length > 0) kbTypes.push(str); });
                if(kbTypes.length == 0) {
                    throw new Error("Invalid ng-keyboard value." );
                }

                ele.bind("focus", function() {
                    ele.addClass("kb-input-highlight");
                    $rootScope.$broadcast("showKeyboard", {
                        target: targetEle,
                        keyboardTypes: kbTypes 
                    });
                });
                
                if(config.dev) {
                    setTimeout(function() {
                        ele[0].focus();
                        window.ele = ele[0];
                    }, 0);
                }
            }
        }
    }]);
    keyboardApp.directive("ngKeyboardBody", ["$document", function($document) {
        return {
            restrict: "E",
            templateUrl: "template/ngKeyboard.html",
            link: function(scope, ele, attrs) {
                var targetEle = null;
                var bufferValue = "";
                var updateTimer = null;

                scope.kbTypes = [];
                scope.active = false;
                scope.kbIdx = -1;
                scope.isCap = false;

                initialKeyboardEvents(); 

                scope.$on("showKeyboard", function(evt, data) {
                    scope.kbTypes = data.keyboardTypes;
                    targetEle = data.target;

                    addAutoHideEvent();
                    preventDocumentMove();
                    
                    showKeyboard();
                    if(!scope.$$phase) {
                        scope.$apply();
                    }
                });

                scope.$on("hideKeyboard", hideKeyboard);

                scope.showCurrKb = function(str) {
                    return str == scope.kbTypes[scope.kbIdx];    
                };

                scope.switchKb = function() {
                    scope.kbIdx = (++scope.kbIdx) % $scope.kbTypes.length;
                };

                scope.showKeyboard = function() {
                    return scope.kbIdx != -1;
                };
                
                scope.getNextKbName = function() {
                    return scope.kbTypes[(scope.kbIdx + 1) % scope.kbTypes.length];
                };
                scope.getSwitchCharText = function() {
                    return scope.isNum ? "#+=": "123";   
                };

                function showKeyboard() {
                    scope.kbIdx = 0;
                }

                function hideKeyboard() {
                    removeAutoHideEvent();
                    removeDocumentMoveHandler();

                    scope.kbIdx = -1;
                    if(!scope.$$phase) {
                        scope.$apply();
                    }
                }
                function preventDocumentMove() {
                    $document.bind("touchmove");
                }
                function removeDocumentMoveHandler() {
                    $document.unbind("touchmove", moveHandler);
                }
                function moveHandler(e) {
                    e.preventDefault();
                }
                function addAutoHideEvent() {
                    $document.bind(activeEvent, documentHandler);
                }
                function removeAutoHideEvent() {
                    $document.unbind(activeEvent, documentHandler);
                }
                function documentHandler(evt) {
                    if(evt.target == targetEle || isContains(ele[0], evt.target)) {
                        return;
                    }
                    hideKeyboard();
                }

                function initialKeyboardEvents() {
                    var kbCtner = angular.element(document.getElementById(config.kbId));
                    var buttons = kbCtner.find("button");
                    buttons.bind(activeEvent, function(event) {
                        if(isNormalButton(this)) {
                            var newVal = getNextValue.apply(this);
                            updateTargetEleValue(newVal);
                        } else {
                            funcs[this.getAttribute("data-func")]();
                        }
                        if(!scope.$$phase) scope.$apply();
                    });
                    //disable right click 
                    return;
                    if(config.dev == true) return;
                    document.getElementById(config.kbId).oncontextmenu = function() {
                        return false;
                    };
                }

                function getNextValue() {
                    var newVal = null;
                    var c = this.getAttribute("data-value") || this.innerHTML;
                    if(scope.isCap == false) {
                        c = c.toLowerCase();
                    }
                    if(!bufferValue) {
                        newVal = c;
                    } else {
                        newVal = bufferValue + c;
                    }
                    return newVal;
                }

                function updateTargetEleValue(value) {
                    bufferValue = value; 
                    if(updateTimer) {
                        clearTimeout(updateTimer);
                        updateTimer == null
                    }
                    updateTimer = setTimeout(function() {
                        targetEle.value = bufferValue; 
                        updateTimer = null;
                    }, 10);
                }
                function isNormalButton(button) {
                    return !button.getAttribute("data-func");
                }

                var funcs = {
                    backspace: function() {
                        if(!bufferValue) return;
                        newValue = bufferValue.substring(0, bufferValue.length - 1);
                        updateTargetEleValue(newValue); 
                    },
                    caps: function() {
                        scope.isCap = !scope.isCap; 
                    },
                    enter: function() {

                    },
                    switch: function() {
                        scope.isNum = true;
                        return scope.kbIdx = (scope.kbIdx + 1) % scope.kbTypes.length;
                    },
                    switchChar: function() {
                        scope.isNum = !scope.isNum; 
                    }
                }

            }
        };
    }]);

    //no need to compile it manually
    //var injector = angular.element(document.body).injector();
    //var $compile = injector.get("$compile");
    if(!(document.getElementById(config.kbId))) {
        var ele = document.createElement("div");
        ele.innerHTML = "<ng-keyboard-body></ng-keyboard-body>";
        document.body.appendChild(ele.childNodes[0]);
    }
})(window);
