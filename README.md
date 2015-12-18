## SWF Reader
  
  A simple [node][nodejs] module for reading [SWF format][swf-format].

## Installation

```sh
$ npm install swf-reader
```

## Usage

```js
var SWFReader = require('swf-reader');

SWFReader.read( 'swf_path.swf', function(err, swf) {
  if ( err ) {
    // handle error
    ...
  }
  console.log(swf);
});
``` 

## SWFReader.read(file, callback)

Returns a [SWF Object](#swf-object) to `callback` function. If it's not possible to read the SWF, an error object is passed as the first argument of `callback`.

## SWFReader.readSync(file)

Returns a [SWF Object](#swf-object) to the caller. If it's not possible to read the SWF, an Exception is thrown.

The `file` parameter of both methods may be either a file path or a buffer of the SWF file.

## <a name="swf-object"></a>SWF Object

The SWF Object method has the following properties :

* `version`: The SWF version.
* `fileLength`: An Object containing the following properties :
  * `compressed`: The SWF compressed size in bytes.
  * `uncompressed`: The SWF uncompressed size in bytes.
* `frameSize`: An Object containing the `width` and `height` of the SWF.
* `frameRate`: The SWF framerate.
* `frameCount`: Number of frames in the SWF.
* `fileAttributes`: FileAtributtes defines characteristics of the SWF file.
  * `useNetwork`: If `true`, the SWF file is given network file access when loaded locally.
  * `as3`: If `true`, the SWF uses ActionScript 3.0. Otherwise it uses ActionScript 1.0 or 2.0.
  * `hasMetaData`: If `true`, the SWF file contains the Metadata tag.
  * `useGPU`: If `true`, the SWF file uses GPU compositing features when drawing graphics.
  * `useDirectBlit`: If `true`, the SWF file uses hardware acceleration to blit graphics to the screen.
* `metadata`: The metadata describes the SWF file to and external process.
* `tags`: An array of `tag`. Each item in the array is an object with a `header` property with the folowing properties:
  * `code`: A number indicating the type of the tag. (see [SWF format][swf-format] for more information)
  * `length`: The length of the tag in bytes.

## Running test

To run the test invoke the following command within the repo directory : 

```sh
$ npm test
```

## Todo

* Read tags fields. 
* Write in tags block.

## Contributors

  Author: [Rafael Leal Dias][rdleal-git]

## License

MIT 

[nodejs]: http://www.nodejs.org
[swf-format]: http://wwwimages.adobe.com/content/dam/Adobe/en/devnet/swf/pdf/swf-file-format-spec.pdf
[rdleal-git]: https://github.com/rafaeldias
