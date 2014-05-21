
var RECORDHEADER_LENTH_FULL = 0x3f;

/**
 *
 * Constructor of SWFBuffer object
 *
 * @param {Buffer} buffer
 * @return Instance of SWFBuffer
 */

function SWFBuffer( buffer ) {
  if ( !Buffer.isBuffer( buffer ) ) {
    throw new Error('Invalid buffer');
  }
  this.buffer = buffer;
  this.pointer = 0;
  this.position = 1;
  this.current = 0;
  this.length = buffer.length;
}

/**
 * Reads unsigned 16 or 32 Little Endian Bits 
 * and advance pointer to next bits / 8 bytes
 *
 * @param {Number} bits
 * @return {Number} Value read from buffer
 */

SWFBuffer.prototype.readUIntLE = function( bits ) {
  var value = 0;
  try {
    value = this.buffer['readUInt' + bits + 'LE'](this.pointer);
    this.pointer += bits / 8;
  } catch ( e ) {
    throw new Error('Invalid Bit Number ' + bits);
  }
  return value;
};

/**
 * Reads unsigned 8 bit from the buffer
 *
 * @return {Number} Value read from buffer
 */

SWFBuffer.prototype.readUInt8 = function() {
  return this.buffer.readUInt8( this.pointer++ );
};

/**
 * Reads RECORDHEADER from next tag in the buffer
 *
 * @return {Object} Tag code and length
 */

SWFBuffer.prototype.readTagCodeAndLength = function() { 
  var n = this.readUIntLE( 16 )
    , tagType = n >> 6
    , tagLength = n & RECORDHEADER_LENTH_FULL; 

  if ( n === 0 ) {
    return false;
  }

  if ( tagLength === RECORDHEADER_LENTH_FULL ) {
    tagLength = this.readUIntLE(32); 
  }

  return { code : tagType, length : tagLength }; 
  
};

/**
 * Reads RECT format
 *
 * @return {Object} x, y, width and height of the RECT
 */

SWFBuffer.prototype.readRect = function() {

  this.start();

  var NBits = this.readBits(5)
    , Xmin  = this.readBits(NBits)/20
    , Xmax  = this.readBits(NBits)/20
    , Ymin  = this.readBits(NBits)/20
    , Ymax  = this.readBits(NBits)/20;

  return { 
    x : Xmin,
    y : Ymin,
    width : Xmax - Xmin,
    height : Ymax - Ymin
  };

}

/**
 * Sets internal pointer to the specified position;
 *
 * @param {Number} pos
 */

SWFBuffer.prototype.seek = function( pos ) {
  this.pointer = pos % this.buffer.length;
};

/**
 * Resets position and sets current to next Byte in buffer
 */
SWFBuffer.prototype.start = function() {
  this.current = this.nextByte();
  this.position = 1;
};

/**
 * Gets next Byte in the buffer and Increment internal pointer
 *
 * @return {Number} Next byte in buffer
 */

SWFBuffer.prototype.nextByte = function() {
  return this.pointer > this.buffer.length ? null : this.buffer[ this.pointer++ ];
};

/**
 * Reads b bits from current byte in buffer
 *
 * @param {Number} b
 * @return {Number} Bits read from buffer
 */

SWFBuffer.prototype.readBits = function( b ){
  var n = 0
    , r = 0; 

  while( n++ < b ) {
    r = (r << 1 ) + ((this.current >> (8-this.position++)) & 1);

    if ( this.position > 8 ) {
      this.position = 1;
      this.current = this.nextByte();
    }
  } 
  return r;
};

/* Exposes class */
exports = module.exports = SWFBuffer;
