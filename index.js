var fs = require('fs')
  , zlib = require('zlib') 
  , lzma = require('lzma-purejs')
  , SWFBuffer = require('./lib/swf-buffer')
  , SWFTags = require('./lib/swf-tags') 

/* Exposes Tags constants */

exports.TAGS = SWFTags;

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
          uncompressed(new SWFBuffer( uncompressed_buff ), swf, next);
        });
        break;
      case 'FWS' : // uncompressed
        uncompressed(new SWFBuffer( swf ), swf, next);
        break;
      case 'ZWS' : // LZMA compressed 
        uncompressed_buff = Buffer.conca([swf.slice(0, 8), lzma.uncompressFile( compressed_buff )]);
        
        uncompressed(new SWFBuffer( uncompressed_buff ), swf, next) ;
        
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
 * @param {Buffer} compressed_buff
 * @param {function} next
 * @api private
 */ 

function uncompressed(buff, compressed_buff, next) { 
  buff.seek(3);// start

  var swf = {
        version     : buff.readUInt8(),
        fileLength  : {
          compressed    : compressed_buff.length,
          uncompressed  : buff.readUIntLE(32) 
        },
        frameSize   : buff.readRect(), // Returns a RECT object. i.e : { x : 0, y : 0, width : 200, height: 300 }
        frameRate   : buff.readUIntLE(16)/256,
        frameCount  : buff.readUIntLE(16)
      }
    , tagHeader
    , tag
    , tags = [];

  while( ( tagHeader = buff.readTagCodeAndLength() ) ) { // Reads TagCodeAndLength from Tag's RECORDHEADER
    // TODO: Read Tags' content
    tag = {
      header : tagHeader
    };
    /*switch( tagHeader.code ) {
      case SWFTags.FileAttributes : 
        break;
      default:
        buff.pointer += tag.length;
        break;
    }*/
    buff.pointer += tagHeader.length;
    tags.push(tag); 
  }

  swf.tags = tags;

  next( null, swf );
} 
