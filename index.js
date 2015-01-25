/**
 * Simple module for reading SWF properties
 *
 * (c) 2014 Rafael Leal Dias <rafaeldias.c at gmail dot com>
 * MIT LICENCE
 *
 */

var fs = require('fs')
  , zlib = require('zlib') 
  , lzma = require('lzma-purejs')
  , SWFBuffer = require('./lib/swf-buffer')
  , SWFTags = require('./lib/swf-tags') 
  , SWFReader = exports;


/**
 * Check if file is Buffer or ArrayBuffer
 * for future support for client usage
 *
 * @param {Buffer|ArrayBuffer) b
 * @api private
 *
 */
function isBuffer(b) {
  return typeof Buffer !== "undefined" && Buffer.isBuffer(b) || b instanceof ArrayBuffer;
}

/**
 * Uncompress SWF and start reading it
 *
 * @param {Buffer|ArrayBuffer} swf
 * @param {function} callback
 *
 */
function uncompress(swf, next) {
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
          readSWFBuff(new SWFBuffer( uncompressed_buff ), swf, next);
        });
        break;
      case 'FWS' : // already uncompressed
        readSWFBuff(new SWFBuffer( swf ), swf, next);
        break;
      case 'ZWS' : // LZMA compressed 
        uncompressed_buff = Buffer.concat([swf.slice(0, 8), lzma.uncompressFile( compressed_buff )]);
        
        readSWFBuff(new SWFBuffer( uncompressed_buff ), swf, next) ;
        
        break;
      default :
        next( new Error('Unknown SWF compression') );
        break;
    };
};

/**
 * Reads tags and their contents, passaing a SWF object to callback 
 *
 * @param {SWFBuffer} buff
 * @param {Buffer} compressed_buff
 * @param {function} callback 
 * @api private
 *
 */ 
function readSWFBuff(buff, compressed_buff, next) { 
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

/* Exposes Tags constants */ 
SWFReader.TAGS = SWFTags;

/**
 * Reads SWF file
 *
 * @param {string} file
 * @param {function} next
 * @api public
 *
 */
exports.read = function(file, next) {
  if (isBuffer(file)) { 
    uncompress(file, next);
  } else {
    fs.readFile(file, function(err, swf) {
      if ( err ) { 
        next(err);
        return;
      }
      uncompress(swf, next);
    });
  }
};
