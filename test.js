// i8,i16,i32,i64,float,double

var FORM_CORR=allocate([0], 'i32', ALLOC_STATIC)
var SCALE_ROTATE=allocate([0], 'i32', ALLOC_STATIC)
var LFO_QUANT=allocate([0], 'i32', ALLOC_STATIC)
var CONCERT_A=allocate([440.0], 'float', ALLOC_STATIC)
var FIXED_PITCH=allocate([2.0], 'float', ALLOC_STATIC)
var FIXED_PULL=allocate([0.1], 'float', ALLOC_STATIC)
var CORR_STR=allocate([4.0], 'float', ALLOC_STATIC)
var CORR_SMOOTH=allocate([0.0], 'float', ALLOC_STATIC)
var PITCH_SHIFT=allocate([1.0], 'float', ALLOC_STATIC)
var LFO_DEPTH=allocate([0.1], 'float', ALLOC_STATIC)
var LFO_RATE=allocate([1.0], 'float', ALLOC_STATIC)
var LFO_SHAPE=allocate([0.0], 'float', ALLOC_STATIC)
var LFO_SYMM=allocate([0.0], 'float', ALLOC_STATIC)
var FORM_WARP=allocate([0.0], 'float', ALLOC_STATIC)
var MIX=allocate([1.0], 'float', ALLOC_STATIC)
var KEY=allocate(["c".charCodeAt(0)], 'i8', ALLOC_STATIC)

function parseWav(wav) {
  function readInt(i, bytes) {
    var ret = 0;
    var shft = 0;
    while (bytes) {
      ret += wav[i] << shft;
      shft += 8;
      i++;
      bytes--;
    }
    return ret;
  }
  if (readInt(20, 2) != 1) throw 'Invalid compression code, not PCM';
  if (readInt(22, 2) != 1) throw 'Invalid number of channels, not 1';
  return {
    sampleRate: readInt(24, 4),
    bitsPerSample: readInt(34, 2),
    samples: wav.subarray(44)
  };
}

function playHTMLAudioElement(wav) {

  document.getElementById("audio").innerHTML=("<audio controls id=\"player\" src=\"data:audio/x-wav;base64,"+encode64(wav)+"\">");
  document.getElementById("player").play();
}

function encode64(bytes) {
  var base64    = ''
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  var byteLength    = bytes.byteLength
  var byteRemainder = byteLength % 3
  var mainLength    = byteLength - byteRemainder

  var a, b, c, d
  var chunk

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63               // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength]

    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3)   << 4 // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }

  return base64
}

function dropHandler(e){

  e.stopPropagation();
  e.preventDefault();

  var fileList = e.dataTransfer.files;

  var fstream = new FileStream( fileList );
  window.wav = false
  fstream.on('data', function(chunk) {
    wav = chunk.target.result
  })
  fstream.on('end', function() {
    console.log('hello')
    window.ary = new Uint8Array(wav)
    window.sample = parseWav(ary)
    window.samples = sample.samples
    var before = JSON.stringify(sample.samples)
    FS = sample.sampleRate
    _instantiateAutotalentInstance(FS)
    _initializeAutotalent(CONCERT_A, KEY, FIXED_PITCH, FIXED_PULL, CORR_STR, CORR_SMOOTH, PITCH_SHIFT, SCALE_ROTATE, LFO_DEPTH, LFO_RATE, LFO_SHAPE, LFO_SYMM, LFO_QUANT, FORM_CORR, FORM_WARP, MIX)

    var sampleSize = samples.length;
    var samplePtr = allocate(samples, 'i32', ALLOC_STATIC);
    for (var i = 0; i < samples.length; i++) {
      HEAP32[((samplePtr + (i * 4))>>2)] = samples[i];
    }
    console.log('Before');
    _processSamples(samplePtr, sampleSize)
    console.log('Done');
    for (var i = 0; i < samples.length; i++) {
      samples[i] = HEAP32[((samplePtr + (i * 4))>>2)]
    }
    console.log('Copied back');
    var after = JSON.stringify(samples)
    console.log("EQUAL:", (before === after))
    playHTMLAudioElement(ary)
  })

}

document.addEventListener('dragover', function(e){
  e.preventDefault();
  e.stopPropagation();
}, false);

document.addEventListener('drop', dropHandler, false);