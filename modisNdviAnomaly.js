/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 5);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony default export */ __webpack_exports__["a"] = ({
  "default": {
    nbPastYears: 5,
    defaultOutputValue: -2,
    ndviMinValue: 0.05,
    currentIndexesMinValuesNumber: 1,
    pastIndexesMinValuesNumber: 3
  },
  ndviAnomaly: {
    pixelEvalMaxValue: 0.5
  },
  loss: {
    lowerTriggerPremium: 0,
    higherTriggerPremium: 1,
    minimumAverageValuePremium: 0.1,
    minimumPayoutPremium: 0
  }
});

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var setup = function setup(dss) {
  // get all bands for display and analysis
  setInputComponents([dss.B02, dss.B01]); // return as RGB

  setOutputComponentCount(3);
}; // you should reduce number of scenes you are processing as much as possible here to speed up the processing


var filterScenes = function filterScenes(scenes, metadataInput, nbPastYears) {
  /*var tmpString = "Number of scenes : " + scenes.length + " | " + "Target date : " + metadataInput.to
  for(let i = 0 ; i < scenes.length ; i++) {
   tmpString = tmpString + " | " + scenes[i].date
  }	  
  throw new Error(tmpString)*/
  return scenes.filter(function (scene) {
    return scene.date.getMonth() === metadataInput.to.getMonth() && scene.date.getFullYear() >= metadataInput.to.getFullYear() - nbPastYears;
  });
};

var calculateLoss = function calculateLoss(currentIndexAverage, pastIndexAverage, minimumAverageValuePremium, lowerTriggerPremium, higherTriggerPremium, minimumPayoutPremium, defaultValue) {
  if (currentIndexAverage === null || pastIndexAverage === null) return defaultValue;
  if (pastIndexAverage < minimumAverageValuePremium || pastIndexAverage <= currentIndexAverage) return 0;
  var percentage = (pastIndexAverage - currentIndexAverage) / pastIndexAverage;
  if (percentage < lowerTriggerPremium) return 0;
  if (percentage > higherTriggerPremium) return 1;
  return Math.max(minimumPayoutPremium, (percentage - (lowerTriggerPremium - minimumPayoutPremium)) / higherTriggerPremium);
};

var calculateNdviAnomaly = function calculateNdviAnomaly(indexesAverages, pixelEvalMaxValue, defaultValue) {
  if (indexesAverages.current === null || indexesAverages.past === null) return defaultValue;
  return Math.max(Math.min(indexesAverages.current - indexesAverages.past, pixelEvalMaxValue), 0 - pixelEvalMaxValue);
};

/* harmony default export */ __webpack_exports__["a"] = ({
  setup: setup,
  filterScenes: filterScenes,
  calculateLoss: calculateLoss,
  calculateNdviAnomaly: calculateNdviAnomaly
});

/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var calculateNDVI = function calculateNDVI(sample, config) {
  var denom = sample.B02 + sample.B01;
  if (denom === 0) return null;
  var result = (sample.B02 - sample.B01) / denom;
  return result > config.ndviMinValue ? result : null;
};

var isClouds = function isClouds(sample) {
  //https://github.com/sentinel-hub/custom-scripts/tree/master/sentinel-2/cby_cloud_detection
  return false;
};

var calculateIndexesForSamples = function calculateIndexesForSamples(samples, scenes, config, processSampleMethod) {
  if (samples.length !== scenes.length) throw new Error('samples and scenes arrays do not have same length');
  return samples.reduce(function (acc, sample, index) {
    if (isClouds(sample)) return acc;
    var indexValue = processSampleMethod(sample, config);
    if (!indexValue) return acc;
    var sceneYear = scenes[index].date.getFullYear();

    if (!acc[sceneYear]) {
      acc[sceneYear] = {
        count: 0,
        sum: 0
      };
    }

    acc[sceneYear].count++;
    acc[sceneYear].sum += indexValue;
    return acc;
  }, {});
};

var calculatePastIndexesAverage = function calculatePastIndexesAverage(indexes, currentYear, config) {
  var pastIndexes = {
    count: 0,
    sum: 0
  };

  for (var i = 1; i <= config.nbPastYears; i++) {
    var indexValue = indexes[currentYear - i];

    if (indexValue && indexValue.count) {
      pastIndexes.count++;
      pastIndexes.sum += indexValue.sum / indexValue.count;
    }
  }

  return pastIndexes.count >= config.pastIndexesMinValuesNumber ? pastIndexes.sum / pastIndexes.count : null;
};

var calculateIndexAverages = function calculateIndexAverages(samples, scenes, config, processSampleMethod) {
  if (!scenes.length) throw new Error('scenes array is empty');
  var indexes = calculateIndexesForSamples(samples, scenes, config, processSampleMethod);
  var currentYear = scenes[0].date.getFullYear();
  /*var tmpString = "\n"
  for(let i = currentYear - config.nbPastYears ; i <= currentYear ; i++) {
   tmpString = tmpString + 
  "year " + i + " | "
  if (indexes[i]) {
      tmpString = tmpString + 
  "count " + indexes[i].count + " | " +
  "sum " + indexes[i].sum
    }
  tmpString = tmpString + "\n"
  }	  
  throw new Error(tmpString)*/

  var currentYearIndex = indexes[currentYear];
  return {
    current: currentYearIndex && currentYearIndex.count >= config.currentIndexesMinValuesNumber && currentYearIndex.sum / currentYearIndex.count || null,
    past: calculatePastIndexesAverage(indexes, currentYear, config)
  };
};

/* harmony default export */ __webpack_exports__["a"] = ({
  calculateNDVI: calculateNDVI,
  calculateIndexesForSamples: calculateIndexesForSamples,
  calculatePastIndexesAverage: calculatePastIndexesAverage,
  calculateIndexAverages: calculateIndexAverages,
  isClouds: isClouds
});

/***/ }),
/* 3 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 4 */,
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var _libs_calculate_indexes__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/* harmony import */ var _libs_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(0);


 // eslint-disable-next-line no-unused-vars

global.setup = function (dss) {
  _libs_utils__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"].setup(dss);
}; // eslint-disable-next-line no-unused-vars


global.filterScenes = function (scenes, metadataInput) {
  return _libs_utils__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"].filterScenes(scenes, metadataInput, _config__WEBPACK_IMPORTED_MODULE_2__[/* default */ "a"]["default"].nbPastYears);
}; // eslint-disable-next-line no-unused-vars


global.evaluatePixel = function (samples, scenes) {
  var indexesAverages = _libs_calculate_indexes__WEBPACK_IMPORTED_MODULE_0__[/* default */ "a"].calculateIndexAverages(samples, scenes, _config__WEBPACK_IMPORTED_MODULE_2__[/* default */ "a"]["default"], _libs_calculate_indexes__WEBPACK_IMPORTED_MODULE_0__[/* default */ "a"].calculateNDVI);
  return colorBlend(_libs_utils__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"].calculateNdviAnomaly(indexesAverages, _config__WEBPACK_IMPORTED_MODULE_2__[/* default */ "a"].ndviAnomaly.pixelEvalMaxValue, _config__WEBPACK_IMPORTED_MODULE_2__[/* default */ "a"]["default"].defaultOutputValue), [_config__WEBPACK_IMPORTED_MODULE_2__[/* default */ "a"]["default"].defaultOutputValue, 0 - _config__WEBPACK_IMPORTED_MODULE_2__[/* default */ "a"].ndviAnomaly.pixelEvalMaxValue, 0, _config__WEBPACK_IMPORTED_MODULE_2__[/* default */ "a"].ndviAnomaly.pixelEvalMaxValue], [[0, 0, 0], [1, 0, 0], [1, 1, 1], [0, 1, 0]]);
};
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(3)))

/***/ })
/******/ ]);