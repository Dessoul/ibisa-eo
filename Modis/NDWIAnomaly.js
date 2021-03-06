var nbPastYears = 4 ;
var defaultOutputValue = -20 ;
var indexMinimumValue = -1 ;
var currentIndexesMinValuesNumber = 1 ;
var pastIndexesMinValuesNumber = 3 ;
var pixelEvalMaxValue = 4 ;


function calculateIndex(sample) {
  var denom = sample.B02 + sample.B06 ;
  if (denom === 0) return null ;

  var result = (sample.B02 - sample.B06) / denom ;
  return result > indexMinimumValue ? result : null ;
} ;


 function isClouds(sample) {
  //Do is null test as seen in ndvi 
  var ndvi = (sample.B02 - sample.B01) / (sample.B02 + sample.B01) ;
  var split = 0.05;
  if(ndvi <= split) {
    return true ;
  }else{
    return false ;
  }
} ;

function calculateIndexesForSamples (samples, scenes) {
  if (samples.length !== scenes.length) throw new Error('samples and scenes arrays do not have same length') ;
  var acc = [] ;
  for (var i=0; i < samples.length ; i++){
    if(!isClouds(samples[i])) {
      var indexValue = calculateIndex(samples[i]) ;
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
  setInputComponents([dss.B01, dss.B02, dss.B06]) ;

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
