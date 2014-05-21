var fs = require('fs')
  , zlib = require('zlib') 
  , lzma = require('lzma-purejs')
  , SWFBuffer = require('./lib/swf-buffer')
  , SWFTags = require('./lib/swf-tags')

/**
 * Reads SWF file
 *
 * @param {String} file
 * @param {function} next
 * @api public
 */

exports.read = function(file, next) {

  fs.readFile(file, function(err, swf) {
    if ( err ) { 
      next(err);
      return;
    } 

    var compressed_type = swf.toString('ascii', 0, 3) // (CWS|FWS|ZWS)
      , compressed_buff = swf.slice(8)
      , uncompressed_buff; 

    // uncompress buffer
    switch( compressed_type ) {
      case 'CWS' : // zlib compressed
        zlib.unzip( compressed_buff, function(err, result) {
          if ( err ) {
            next(err);
            return;
          } 
          uncompressed_buff = Buffer.concat([swf.slice(0, 8), result]);
          uncompressed(new SWFBuffer( uncompressed_buff ), next);
        });
        break;
      case 'FWS' : // uncompressed
        uncompressed(new SWFBuffer( swf ), next);
        break;
      case 'ZWS' : // LZMA compressed 
        uncompressed_buff = Buffer.conca([swf.slice(0, 8), lzma.uncompressFile( compressed_buff )]);
        
        uncompressed(new SWFBuffer( uncompressed_buff ), next) ;
        
        break;
      default :
        next( new Error('Unknown SWF compression') );
        break;
    }
  });
};

/**
 * Reads tags and their contents, passaing a SWF object to next
 *
 * @param {SWFBuffer} buff
 * @param {function} next
 * @api private
 */ 

function uncompressed(buff, next) { 
  buff.seek(3);// start

  var swf = {
        version     : buff.readUInt8(),
        size        : buff.readUIntLE(32),
        frameSize   : buff.readRect(), // Returns a RECT object. i.e : { x : 0, y : 0, width : 200, height: 300 }
        fps         : buff.readUIntLE(16)/256,
        frameCount  : buff.readUIntLE(16),
        tags        : []
      }
    , tag;

  while( ( tag = buff.readTagCodeAndLength() ) ) { // Reads TagCodeAndLength from Tag's RECORDHEADER
    swf.tags.push(tag); 
    // TODO: Read Tags' content
    buff.pointer += tag.length;
  }

  next( null, swf );
} 
