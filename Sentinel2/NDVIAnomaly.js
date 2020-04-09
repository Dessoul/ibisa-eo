var nbPastYears = 4 ;
var defaultOutputValue = -2 ;
var ndviMinValue = 0.05 ;
var currentIndexesMinValuesNumber = 1 ;
var pastIndexesMinValuesNumber = 3 ;
var pixelEvalMaxValue = 0.5 ;


 function calculateIndex(sample) {
//  throw new Error('calculateIndex') ;

  var denom = sample.B04 + sample.B08 ;
  if (denom === 0) return null ;

  var result = (sample.B08 - sample.B04) / denom ;
  return result > ndviMinValue ? result : null ;
} ;


 function isClouds(sample) {
//  throw new Error('isClouds') ;

  //https://github.com/sentinel-hub/custom-scripts/tree/master/sentinel-2/cby_cloud_detection
  var ngdr = (sample.B03 - sample.B04) / (sample.B03 + sample.B04) ;
  var ratio = (sample.B03 - 0.175) / (0.39 - 0.175) ;

  return sample.B11 > 0.1 && (ratio > 1 || (ratio > 0 && ngdr > 0)) ;
} ;



 function calculateIndexesForSamples (samples, scenes, processSampleMethod) {
//  throw new Error('calculateIndexesForSamples') ;

  if (samples.length !== scenes.length) throw new Error('samples and scenes arrays do not have same length') ;
  var acc = [] ;
  for (var i=0; i < samples.length ; i++){
    if(!isClouds(samples[i])) {
      var indexValue = processSampleMethod(samples[i]) ;
      if(indexValue) {
        var sceneYear = scenes[i].date.getFullYear() ;

       if (!acc[sceneYear]) {
         acc[sceneYear] = {
           count: 1,
           sum: indexValue,
         }
      }else{
       acc[sceneYear].count++ ;
       acc[sceneYear].sum += indexValue ;
       }
     }
   }  
 }
return acc
} ;


 function calculatePastIndexesAverage(indexes, currentYear) {
//  throw new Error('calculatePastIndexesAverage') ;

  var pastIndexes = {
    count: 0,
    sum: 0,
  } ;

  for (var i = 1; i <= nbPastYears; i++) {
    var indexValue = indexes[currentYear - i] ;
    if (indexValue && indexValue.count) {
      pastIndexes.count++ ;
      pastIndexes.sum += indexValue.sum / indexValue.count ;
    }
  }

  return pastIndexes.count >= pastIndexesMinValuesNumber ? pastIndexes.sum / pastIndexes.count : null ;
} ;


 function calculateIndexAverages(samples, scenes, processSampleMethod) {
//  throw new Error('calculateIndexAverages') ;

  if (!scenes.length) throw new Error('scenes array is empty') ;

  var indexes = calculateIndexesForSamples(samples, scenes, processSampleMethod) ;
  var currentYear = scenes[0].date.getFullYear() ;

  /*var tmpString = "\n"
  for(let i = currentYear - nbPastYears ; i <= currentYear ; i++) {
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

  var currentYearIndex = indexes[currentYear] ;

  return {
    current: currentYearIndex && currentYearIndex.count >= currentIndexesMinValuesNumber && currentYearIndex.sum / currentYearIndex.count || null,
    past: calculatePastIndexesAverage(indexes, currentYear),
  } ;
} ;


function setup(dss) {
//  throw new Error('setup') ;

  // get all bands for display and analysis
  //setInputComponents([dss.B04, dss.B08]);
  setInputComponents([dss.B03, dss.B04, dss.B08, dss.B11]) ;

  // return as RGB
  setOutputComponentCount(3) ;
} ;


// you should reduce number of scenes you are processing as much as possible here to speed up the processing
function filterScenes(scenes, metadataInput) {
  filteredScenes = [];
    for (var i=0; i < scenes.length ; i++){
      if (scenes[i].date.getMonth()===metadataInput.to.getMonth() && scenes[i].date.getFullYear() >= metadataInput.to.getFullYear() - nbPastYears){
        filteredScenes.push(scenes[i]);
      }
    }  
return filteredScenes;
	
} ;


function calculateIndexAnomaly(indexesAverages) {
  //throw new Error('calculateIndexAnomaly') ;

  if (indexesAverages.current === null || indexesAverages.past === null) return defaultOutputValue ;

  return Math.max(
    Math.min(indexesAverages.current - indexesAverages.past, pixelEvalMaxValue),
    0 - pixelEvalMaxValue
  ) ;
} ;


// eslint-disable-next-line no-unused-vars
 function evaluatePixel(samples, scenes) {
//  throw new Error('evaluatePixel') ;

  var indexesAverages = calculateIndexAverages(
    samples,
    scenes,
    calculateIndex
  ) ;

  return colorBlend(
    calculateIndexAnomaly(indexesAverages),
    [defaultOutputValue, 0 - pixelEvalMaxValue, 0, pixelEvalMaxValue],
    [
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 1],
      [0, 1, 0]
    ]
  ) ;
} ;
