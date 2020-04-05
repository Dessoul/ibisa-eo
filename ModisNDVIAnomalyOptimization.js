// Filter Reduce 


var nbPastYears = 4 ;
var defaultOutputValue = -2 ;
var ndviMinValue = 0.05 ;
var currentIndexesMinValuesNumber = 1 ;
var pastIndexesMinValuesNumber = 3 ;
var pixelEvalMaxValue = 0.5 ;


 function calculateIndex(sample) {
//  throw new Error('calculateIndex') ;

  var denom = sample.B02 + sample.B01 ;
  if (denom === 0) return null ;
// Need result for if so no optimization needed
  var result = (sample.B02 - sample.B01) / denom ;
  return result > ndviMinValue ? result : null ;
} ;


 function isClouds(sample) {
// NDVI detects clouds 
  return False
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
  setInputComponents([dss.B01, dss.B02]) ;

  // return as RGB
  setOutputComponentCount(3) ;
} ;


// you should reduce number of scenes you are processing as much as possible here to speed up the processing
function filterScenes(scenes, metadataInput) {
  //throw new Error('filteenrScenes') ;

  /*var tmpString = "Number of scenes : " + scenes.length + " | " + "Target date : " + metadataInput.to
  for(let i = 0 ; i < scenes.length ; i++) {
	  tmpString = tmpString + " | " + scenes[i].date
  }
  throw new Error(tmpString)*/
//Filters out the data


//return
   scenes.filter(function(scene) {return (scene.date.getMonth() === metadataInput.to.getMonth() && scene.date.getFullYear() >= metadataInput.to.getFullYear() - nbPastYears) ; }) ;


  throw new Error(typeof(scenes))    

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
