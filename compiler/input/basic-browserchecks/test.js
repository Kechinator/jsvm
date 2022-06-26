

console.log("Checking Basic Browser Properties")

var appVersion = navigator.appVersion
var evalLength = eval.toString().length
// var accelerometerPermission = typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function'
var deviceMemory = navigator.deviceMemory
var languages = navigator.languages
var concurrency = navigator.hardwareConcurrency



console.log(appVersion, evalLength, deviceMemory, languages, concurrency)