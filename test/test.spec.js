var SWFReader = require('../index');

SWFReader.read('test.swf', function(err, swf) {
  if ( err ) {
    console.log(err);
    return;
  }
  console.log(swf);
});
