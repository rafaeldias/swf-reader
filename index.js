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

function readSWFTags(buff, swf) {
  var tags = []
    , tag
    , tagHeader
    , flag
    , l
    , sc
    , fc;

  /* Reads TagCodeAndLength from Tag's RECORDHEADER */
  while( (tagHeader = buff.readTagCodeAndLength()) ) { 
    tag = {
      header : tagHeader
    };
    switch( tagHeader.code ) {
      case SWFTags.FileAttributes : 
        flag =  buff.readUIntLE(32);
        fileAttrs = {}
        
        fileAttrs.useNetwork    = tag.useNetwork    = !!(flag & 0x1);
        fileAttrs.as3           = tag.as3           = !!(flag & 0x8);
        fileAttrs.hasMetaData   = tag.hasMetaData   = !!(flag & 0x10);
        fileAttrs.useGPU        = tag.useGPU        = !!(flag & 0x20);
        fileAttrs.useDirectBit  = tag.useDirectBlit = !!(flag & 0x40);
        
        swf.fileAttributes = fileAttrs;
        break;
      case  SWFTags.Metadata :
        swf.metadata = tag.metadata = buff.readString()
        break;
      case SWFTags.SetBackgroundColor :
        tag.RGB = buff.readRGB();
        swf.backgroundColor = '#' + (tag.RGB[0]*65536 + tag.RGB[1]*256 + tag.RGB[0]).toString(16);
        break;
      case SWFTags.Protect :
        swf.protect = tagHeader.length && buff.readString();
        break;
      case SWFTags.DefineSceneAndFrameLabelData :
        sc = tag.sceneCount = buff.readEncodedU32();
        tag.scenes = [];

        while (sc--)
          tag.scenes.push({
            offset  : buff.readEncodedU32(),
            name    : buff.readString()
          });

        fc = tag.frameLabelCount = buff.readEncodedU32();
        tag.labels = [];

        while (fc--)
          tag.labels.push({
            frameNum    : buff.readEncodedU32(),
            frameLabel  : buff.readString()
          });
        break;
      /**
       * DefineShape4 extends the capabilities of
       * DefineShape3 by using a new line style
       * record in the shape
       */
      //case SWFTags.DefineShape4 :
      //  /* id for this character */
      //  tag.ShapeId = buff.readUIntLE(16);
      //  /* bounds of the shape */
      //  tag.ShapeBounds = buff.readRect();
      //  /* bounds of the shape, excluding the strokes */
      //  tag.EdgeBounds = buff.readRect();
      //  /* reserved, must be 0 */
      //  if (0 !== buff.readBits(5))
      //    throw new Error('Reserved bit used.');
      //  /* if 1, use fill winding. >= SWF 10 */
      //  if (swf.version >= 10)
      //    tag.UsesFillWindingRule = buff.readBits(1);
      //  /**
      //   * if 1, shape contains at least one
      //   * non-scaling stroke.
      //   */
      //  tag.UsesNonScallingStrokes = buff.readBits(1);
      //  /**
      //   * if 1, shape contains at least one
      //   * scaling stroke
      //   */
      //  tag.UsesScalingStrokes = buff.readBits(1);
      //  tag.shapes = buff.readShapeWithStyle();
      //  break;
      case SWFTags.FrameLabel :
        tag.name = buff.readString()
        l = Buffer.byteLength(tag.name);
        /* check if it's an named anchor */
        if (l & (tagHeader.length - 1) != l)
          tag.anchor = buff.readUInt8();
        break;
      case SWFTags.DefineSprite :
        tag.SpriteID = buff.readUIntLE(16);
        tag.FrameCount = buff.readUIntLE(16);
        tag.ControlTags = readSWFTags(buff, swf);
        break;
      case SWFTags.ExportAssets :
        tag.count = buff.readUIntLE(16); 
        tag.assets = [];

        l = 0;

        while (l++ < tag.count)
          tag.assets.push({
            id : buff.readUIntLE(16),
            name : buff.readString()
          });
        break;
      case SWFTags.ImportAssets :
        /**
         * URL where the source SWF file can be found
         */
        tag.url = buff.readString();
        /**
         * Number of assets to import
         */
        tag.count = buff.readUIntLE(16);
        tag.assets = [];

        l = 0;

        while (l++ < tag.count)
          tag.assets.push({
            /**
             * Character ID for the l-th item 
             * in importing SWF file
             */
            id : buff.readUIntLE(16),
            /**
             * Identifies for the l-th
             * imported character
             */
            name : buff.readString()
          });
        break;
      case SWFTags.ImportAssets2 :
        tag.url = buff.readString();

        if ( !(1 === buff.readUInt8() && 0 === buff.readUInt8()) ) {
          throw new Error('Reserved bits for ImportAssets2 used');
        }

        tag.count = buff.readUIntLE(16);
        tag.assets = [];

        l = 0;

        while (l++ < tag.count)
          tag.assets({
            id : buff.readUIntLE(16),
            name : buff.readString()
          });
        break;
      case SWFTags.EnableDebbuger :
        tag.password = buff.readString()
        break;
      case SWFTags.EnableDebugger2 : 
        if (0 !== buff.readUIntLE(16)) {
          throw new Error('Reserved bit for EnableDebugger2 used.');
        }
        tag.password = buff.readString()
        break;
      case SWFTags.ScriptLimits :
        /**
         * Maximum recursion Depth
         */
        tag.maxRecursionDepth = buff.readUIntLE(16);
        /**
         * Maximum ActionScript processing time before script
         * stuck dialog box displays
         */
        tag.scriptTimeoutSeconds = buff.readUIntLE(16);
        break;
      case SWFTags.SymbolClass :
        tag.numSymbols = buff.readUIntLE(16);
        tag.symbols = [];

        l = 0;

        while (l++ < tag.numSymbols)
          tag.symbols.push({
            id : buff.readUIntLE(16),
            name : buff.readString()
          });
        break;
      case SWFTags.DefineScalingGrid :
        tag.characterId = buff.readUIntLE(16);
        tag.splitter = buff.readRect();
        break;
      case SWFTags.setTabIndex :
        tag.depth = buff.readUIntLE(16);
        tag.tabIndex = buff.readUIntLE(16);
        break;
      case SWFTags.DoAction:
        tag.actions = readDoAction(buff);
        break;
      default:
        tag.data = buff.buffer.slice(buff.pointer, buff.pointer + tagHeader.length);
        buff.pointer += tagHeader.length;
        break;
    }
    tags.push(tag); 
  }
  return tags;
}

function readDoAction(buff){
  var actionCode;
  var actions = [];
  while((actionCode = buff.readUInt8()) != 0) {
    var action = {
      code: actionCode 
    };
    if(actionCode >= 0x80) {
      var length = buff.readUIntLE(16);   
      // see other actions
      // http://www.doc.ic.ac.uk/lab/labman/swwf/SWFalexref.html#tag_doaction   
      switch(actionCode) {
        // Declare Dictionary
        case 0x88:          
          var count = buff.readUIntLE(16);
          action.dictionary = [];
          for(i=0; i<count; i++) {
            action.dictionary.push(buff.readString());
          }
          break;
      }
    }
    actions.push(action);
  }
}


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
    , isSync = 'function' !== typeof next;

  try {
    swf.tags = readSWFTags(buff, swf);
  } catch(e) {
    if (isSync) throw e;
    return next(e);
  }

  return isSync && swf || next( null, swf );
} 

/**
 * Concat SWF Header with uncompressed Buffer
 *
 * @param {Buffer|ArrayBuffer} buff
 * @param {Buffer|ArrayBuffer} swf
 */
function concatSWFHeader(buff, swf) {
  return Buffer.concat([swf.slice(0, 8), buff]);
}

/**
 * Uncompress SWF and start reading it
 *
 * @param {Buffer|ArrayBuffer} swf
 * @param {function} callback
 *
 */
function uncompress(swf, next) {
  var compressed_buff = swf.slice(8)
    , uncompressed_buff
    , isSync = 'function' !== typeof next
    , e; 

    // uncompress buffer
    switch( swf[0] ) {
      case 0x43 : // zlib compressed
        if (isSync) {
          uncompressed_buff = concatSWFHeader(zlib.unzipSync(compressed_buff), swf);
          return readSWFBuff(new SWFBuffer(uncompressed_buff), swf);
        }

        zlib.unzip( compressed_buff, function(err, result) {
          if ( err ) {
            next(err);
            return;
          } 
          uncompressed_buff = concatSWFHeader(result, swf);
          readSWFBuff(new SWFBuffer(uncompressed_buff), swf, next);
        });
        break;
      case 0x46 : // uncompressed
        return readSWFBuff(new SWFBuffer( swf ), swf, next);
        break;
      case 0x5a : // LZMA compressed 
        uncompressed_buff = Buffer.concat([swf.slice(0, 8), lzma.decompressFile(compressed_buff)]);
        
        return readSWFBuff(new SWFBuffer(uncompressed_buff), swf, next); 
        break;
      default :
        e = new Error('Unknown SWF compressions');

        if (isSync) {
          throw e;
        } else {
          next(e);
        }
    };
};

/**
 * Check if file is Buffer or ArrayBuffer
 *
 * @param {Buffer|ArrayBuffer) b
 * @api private
 *
 */
function isBuffer(b) {
  return typeof Buffer !== "undefined" && Buffer.isBuffer(b) || b instanceof ArrayBuffer;
}

/* Exposes Tags constants */ 
SWFReader.TAGS = SWFTags;

/**
 * Reads SWF file
 *
 * @param {String|Buffer}} file
 * @param {function} next - if not a function, uses synchronous algorithm
 * @api public
 *
 */
SWFReader.read = SWFReader.readSync = function(file, next) {
  if (isBuffer(file)) {
    /* File is already a buffer */
    return uncompress(file, next);
  } else {
    /* Get the buffer */
    if ('function' === typeof next) {
      fs.readFile(file, function(err, swf) {
        if ( err ) {
          next(err);
          return;
        }
        uncompress(swf, next);
      });
    } else {
      return uncompress(fs.readFileSync(file));
    }
  }
};
