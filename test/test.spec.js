var SWFReader = require('../index')
  , fs = require('fs')
  , SWFInfo = function(swf) {
      console.log('SWF version : ' + swf.version);
      console.log('SWF size : ' + swf.frameSize.width + 'x' + swf.frameSize.height);
      console.log('SWF background : ' + swf.backgroundColor);
      console.log('SWF compressed bytes : ' + swf.fileLength.compressed + ', uncompressed bytes : ' + swf.fileLength.uncompressed);
      console.log('SWF frameRate : ' + swf.frameRate);
      console.log('SWF frames : ' + swf.frameCount);
      console.log('Test OK.');
    };

if ( process.env.TEST_FILE ) {
  console.log('Testing file path...');
  SWFReader.read(process.env.TEST_FILE, function(err, swf){
    if ( err ) {
      console.log(err);
      return;
    }

    SWFInfo(swf);

    console.log('Testing buffer...');

    fs.readFile(process.env.TEST_FILE, function(err, buff) {
      if ( err ) {
        console.log(err);
        return;
      }

      SWFReader.read(buff, function(err, swf) {
        if ( err ) {
          console.log(err);
          return;
        }

        SWFInfo(swf);

        console.log('Testing Sync...');
        SWFInfo(SWFReader.readSync(buff));


        console.log('Tags:');
        console.log(swf.tags);
      });
    });
  });
}else{
    throw new Error("TEST_FILE env var not set to .swf");
}
