var nbPastYears = 2 ;
var defaultOutputValue = -2 ;
var indexMinimumValue = 0.05  ;
var pixelEvalMaxValue = 1 ;
var indexesMinValuesNumber = 10 ;
var minimumYear = 2000 ;


function calculateIndex(sample) {
  var denom = sample.B02 + sample.B01 ;
  if (denom === 0) return null ;

  var result = (sample.B02 - sample.B01) / denom ;
  return result > indexMinimumValue ? result : null ;
} ;


 function isClouds(sample) {
  return false;
} ;

function calculateIndexesForSamples (samples, scenes) {
  ///XXX NEW
  var indexes = [] ;
  for (var i=0; i < samples.length ; i++){
    if(!isClouds(samples[i])) {
      var indexValue = calculateIndex(samples[i]) ;
      if(indexValue) {
        var sceneYear = scenes[i].date.getFullYear() ;

       if (!indexes[sceneYear]) {
         indexes[sceneYear] = [indexValue] ;
      }else{
       indexes[sceneYear].push(indexValue);
       }
    }
   }  
  }
  return indexes ;
} ;

 function calculateIndexesAverageSD(indexes, average) {
  ///XXX NEW
  var sum = 0 ;
  var count = 0 ;
  for (var i=minimumYear; i < indexes.length ; i++){
    if(indexes[i]) {
      var indexList = indexes[i] ;
      for (var j=0; i < indexList.length ; j++){
        var indexValue = indexList[j] ;
    /*for (let indexList of indexes) {
    for (let indexValue of indexList) {*/
        if (average === null) {
          sum += indexValue ;
        } else {
          sum += (indexValue - average) * (indexValue - average) ;
        }
        count++ ;
  	}
  }
  }
   
  if (average === null) {
    return count >= indexesMinValuesNumber ? sum / count : null ;
  } else {
    return Math.sqrt(sum / count) ;
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
  var filteredScenes = [];
    for (var i=0; i < scenes.length ; i++){
      if (scenes[i].date.getMonth()===metadataInput.to.getMonth() && scenes[i].date.getFullYear() >= metadataInput.to.getFullYear() - nbPastYears){
        filteredScenes.push(scenes[i]);
      }
    }  
  return filteredScenes;
} ;

//Added Scenes to get the current year
function calculateIndexAnomaly(samples,scenes) {
  ///XXX NEW
  var indexes = calculateIndexesForSamples(samples, scenes) ;
  //throw new Error(indexes) ;

  var average = calculateIndexesAverageSD(indexes, null);
  if (average === null) return defaultOutputValue ;

  var standardDeviation = calculateIndexesAverageSD(indexes, average);

  //standardDeviation cannot be null or zero because pastIndexesAverages is not null 
  return Math.max(Math.min(standardDeviation,pixelEvalMaxValue),0-pixelEvalMaxValue) ;
  
} ;


// eslint-disable-next-line no-unused-vars
 function evaluatePixel(samples, scenes) {
  return colorBlend(
    calculateIndexAnomaly(samples,scenes),

    [defaultOutputValue, 0 - pixelEvalMaxValue, 0, pixelEvalMaxValue],
    [
      [0, 0, 0],
      //[0.9294, 0.4901, 0.1921],
    [1,0,0],
      [1, 1, 1],
      //[0, 0.1254, 0.3764]
    [0,1,0]
    ]
  ) ;
} ;
