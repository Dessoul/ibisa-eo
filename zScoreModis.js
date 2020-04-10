var nbPastYears = 4 ;
var defaultOutputValue = -20 ;
var indexMinimumValue = -1 ;
var currentIndexesMinValuesNumber = 1 ;
var pastIndexesMinValuesNumber = 3 ;
var pixelEvalMaxValue = 11 ;


 function calculateIndex(sample) {
//  throw new Error('calculateIndex') ;

  var denom = sample.B02 + sample.B06 ;
  if (denom === 0) return null ;

  var result = (sample.B02 - sample.B06) / denom ;
  return result > indexMinimumValue ? result : null ;
} ;


 function isClouds(sample) {
//  throw new Error('isClouds') ;

  //https://github.com/sentinel-hub/custom-scripts/tree/master/sentinel-2/cby_cloud_detection
  //var ngdr = (sample.B03 - sample.B04) / (sample.B03 + sample.B04) ;
  //var ratio = (sample.B03 - 0.175) / (0.39 - 0.175) ;
  //return sample.B11 > 0.1 && (ratio > 1 || (ratio > 0 && ngdr > 0)) ;

  //Do is null test as seen in ndvi 
  var ndvi = (sample.B02 - sample.B01) / (sample.B02 + sample.B01)
  var split = 0.05;
  if(ndvi <= split) {
    return true
  }else{
    return false
  }
} ;




function calculateIndexesForSamples (samples, scenes, processSampleMethod) {
  //  throw new Error('calculateIndexesForSamples') ;
  
    if (samples.length !== scenes.length) throw new Error('samples and scenes arrays do not have same length') ;
  
    return samples.reduce(function(acc, sample, index) {
      if (isClouds(sample)) return acc ;
  
      var indexValue = processSampleMethod(sample) ;
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


function calculatePastIndexesStandardDeviation (indexes, currentYear, pastAverage) {
  var pastIndexes = {
    count: 0,
    sumSquareDeviation: 0
  }

  for (var i= 1; i <=nbPastYears; i++ ){
    var indexValue = indexes[currentYear -i];
    if(indexValue && indexValue.count){
      pastIndexes.count++;
      var averageIndexForMonth = indexValue.sum /indexValue.count
      pastIndexes.sum += (averageIndexForMonth-pastAverage) * (averageIndexForMonth - pastAverage)
    }
  }
  return Math.sqrt(pastIndexes.sum/pastIndexes.count)
}



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
  setInputComponents([dss.B01, dss.B02, dss.B06]) ;

  // return as RGB
  setOutputComponentCount(3) ;
} ;


// you should reduce number of scenes you are processing as much as possible here to speed up the processing
function filterScenes(scenes, metadataInput) {
  //throw new Error('filterScenes') ;

  /*var tmpString = "Number of scenes : " + scenes.length + " | " + "Target date : " + metadataInput.to
  for(let i = 0 ; i < scenes.length ; i++) {
	  tmpString = tmpString + " | " + scenes[i].date
  } function calculateIndexesForSamples (samples, scenes, processSampleMethod) {
//  throw new Error('calculateIndexesForSamples') ;

  if (samples.length !== scenes.length) throw new Error('samples and scenes arrays do not have same length') ;

  return samples.reduce(function(acc, sample, index) {
    if (isClouds(sample)) return acc ;

    var indexValue = processSampleMethod(sample) ;
    if (!indexValue) return acc ;

    var sceneYear = scenes[index].date.getFullYear() ;
    if (!acc[sceneYear]) {
      acc[sceneYear] = {
        count: 0,
        sum: 0,
      } ;

    acc[sceneYear].count++ ;
    acc[sceneYear].sum += indexValue ;

    return acc ;
  }, {}) ;
} ;

  throw new Error(tmpString)*/

  return scenes.filter(function(scene) {return (scene.date.getMonth() === metadataInput.to.getMonth() && scene.date.getFullYear() >= metadataInput.to.getFullYear() - nbPastYears) ; }) ;
} ;

//Added Scenes to get the current year
function calculateIndexAnomaly(indexesAverages,scenes,samples) {
  //throw new Error('calculateIndexAnomaly') ;
//throw indexesAverages
  if (indexesAverages.current === null || indexesAverages.past === null) return defaultOutputValue ;

  // has to receive indexes.Averages stdev so current-past/ stdev
/*
  return Math.max(
    Math.min(indexesAverages.current - indexesAverages.past, pixelEvalMaxValue),
    0 - pixelEvalMaxValue
  ) ; */
  var indexes = calculateIndexesForSamples(samples, scenes, processSampleMethod) ;


  return Math.max(Math.min((indexesAverages.current-indexesAverages.past)/
  calculatePastIndexesStandardDeviation(indexes, 
    scenes[0].date.getFullYear(),indexesAverages.past),pixelEvalMaxValue),0-pixelEvalMaxValue)

} ;


// eslint-disable-next-line no-unused-vars
 function evaluatePixel(samples, scenes) {
//  throw new Error('evaluatePixel') ;

  var indexesAverages = calculateIndexAverages(
    samples,
    scenes,
    calculateIndex 
  ) ;
// Give range of color that you are given, 
    const x = (z) =>{
      return z/255
    }

  return colorBlend(
    calculateIndexAnomaly(indexesAverages,scenes,samples),

    //defaultOutputvalue = -11
    // 
    [defaultOutputValue, 0 - pixelEvalMaxValue, 0, pixelEvalMaxValue],
    [
      [0, 0, 0],
      [x(237), x(125), x(49)],
      [1, 1, 1],
      [0, x(32), x(96)]
    ]
  ) ;
} ;


//restore script ndwi as was
//create zscore file 
//and optimize the script 
