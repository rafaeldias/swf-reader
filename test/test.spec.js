var SWFReader = require('../index');

var https = require('https');

var buffers = [];

if(process.env.TEST_URL) {
var request = https.get(process.env.TEST_URL , function (response) {
    response.on('data' , function (chunk) {
        buffers.push(chunk);
    });

    response.on('end' , function (chunk) {
        

        var buffer  = Buffer.concat(buffers);

        SWFReader.readBuffer(buffer, function(err, swf) {
          if ( err ) {
            console.log(err);
            return;
          }
          console.log(swf);
        });


    });



});
}else{
    throw new Error("TEST_URL env var not set to .swf");
}






