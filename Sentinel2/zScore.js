 
var nbPastYears = 4 ;
var defaultOutputValue = -20 ;
var indexMinimumValue = -1 ;
var currentIndexesMinValuesNumber = 1 ;
var pastIndexesMinValuesNumber = 3 ;
var pixelEvalMaxValue = 4 ;

 function calculateIndex(sample) {
//  throw new Error('calculateIndex') ;

  var denom = sample.B03 + sample.B08 ;
  if (denom === 0) return null ;

  var result = (sample.B08 - sample.B03) / denom ;
  return result > indexMinimumValue ? result : null ;
} ;


 function isClouds(sample) {
//  throw new Error('isClouds') ;

  //https://github.com/sentinel-hub/custom-scripts/tree/master/sentinel-2/cby_cloud_detection
  //var ngdr = (sample.B03 - sample.B04) / (sample.B03 + sample.B04) ;
  //var ratio = (sample.B03 - 0.175) / (0.39 - 0.175) ;
  //return sample.B11 > 0.1 && (ratio > 1 || (ratio > 0 && ngdr > 0)) ;
  var ndvi = (sample.B08 - sample.B04) / (sample.B04 + sample.B08)
  var split = 0.05;
  if(ndvi <= split) {
    return true
  }else{
    return false
  }
} ;


function calculateIndexesForSamples (samples, scenes) {
    if (samples.length !== scenes.length) throw new Error('samples and scenes arrays do not have same length') ;
  
    return samples.reduce(function(acc, sample, index) {
      if (isClouds(sample)) return acc ;
  
      var indexValue = calculateIndex(sample) ;
      if (!indexValue) return acc ;
  
      var sceneYear = scenes[index].date.getFullYear() ;
      if (!acc[sceneYear]) {
        acc[sceneYear] = {
          count: 0,
          sum: 0,
        } ;
      }
  
      acc[sceneYear].count++ ;
      acc[sceneYear].sum += indexValue ;
  
      return acc ;
    }, {}) ;
  } ;

 function calculatePastIndexesAverage(indexes, currentYear, pastAverage) {
  var pastIndexes = {
    count: 0,
    sum: 0,
  } ;

  for (var i = 1; i <= nbPastYears; i++) {
    var indexValue = indexes[currentYear - i] ;
    if (indexValue && indexValue.count) {
      pastIndexes.count++ ;
	  if (pastAverage === null) {
		  pastIndexes.sum += indexValue.sum / indexValue.count ;
	  } else {
		  var averageIndexForMonth = indexValue.sum /indexValue.count ;
		  pastIndexes.sum += (averageIndexForMonth - pastAverage) * (averageIndexForMonth - pastAverage) ;
	  }
    }
  }

  if (pastAverage === null) {
	  return pastIndexes.count >= pastIndexesMinValuesNumber ? pastIndexes.sum / pastIndexes.count : null ;
  } else {
	  return Math.sqrt(pastIndexes.sum / pastIndexes.count) ;
  }
} ;

function setup(dss) {
  // get all bands for display and analysis
  setInputComponents([dss.B03, dss.B04, dss.B08]) ;

  // return as RGB
  setOutputComponentCount(3) ;
} ;


// you should reduce number of scenes you are processing as much as possible here to speed up the processing
function filterScenes(scenes, metadataInput) {
  return scenes.filter(function(scene) {return (scene.date.getMonth() === metadataInput.to.getMonth() && scene.date.getFullYear() >= metadataInput.to.getFullYear() - nbPastYears) ; }) ;
} ;

//Added Scenes to get the current year
function calculateIndexAnomaly(samples,scenes) {
	
  if (!scenes.length) throw new Error('scenes array is empty') ;

  var indexes = calculateIndexesForSamples(samples, scenes) ;
  var currentYear = scenes[0].date.getFullYear() ;
  var currentYearIndex = indexes[currentYear] ;

  var currentIndexesAverages = currentYearIndex && currentYearIndex.count >= currentIndexesMinValuesNumber && currentYearIndex.sum / currentYearIndex.count || null ;
  if (currentIndexesAverages === null) return defaultOutputValue ;
  
  var pastIndexesAverages = calculatePastIndexesAverage(indexes, currentYear, null);
  if (pastIndexesAverages === null) return defaultOutputValue ;

  var standardDeviation = calculatePastIndexesAverage(indexes, currentYear, pastIndexesAverages);

  //standardDeviation cannot be null or zero because pastIndexesAverages is not null 
  var finalIndex = (currentIndexesAverages - pastIndexesAverages) / standardDeviation ;
  return Math.max(Math.min(finalIndex,pixelEvalMaxValue),0-pixelEvalMaxValue) ;
  
} ;


// eslint-disable-next-line no-unused-vars
 function evaluatePixel(samples, scenes) {
  return colorBlend(
    calculateIndexAnomaly(samples,scenes),

    [defaultOutputValue, 0 - pixelEvalMaxValue, 0, pixelEvalMaxValue],
    [
      [0, 0, 0],
      [0.9294, 0.4901, 0.1921],
	 // [1,0,0],
     [1, 1, 1],
      [0, 0.1254, 0.3764]
	 // [0,1,0]
    ]
  ) ;
} ;
