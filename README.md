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

Returns a `SWF Object` (described bellow) to `callback` function. If it's not possible to read the SWF, an error object is passed as the first argument of `callback`.

The `file` parameter is a file path or a buffer of the SWF file.

## SWF Object

The SWF Object passed to the `callback` function of the `read` method has the following properties :

* `version`: The SWF version.
* `fileLength`: An Object containing the following properties :
  * `compressed`: The SWF compressed size in bytes.
  * `uncompressed`: The SWF uncompressed size in bytes.
* `frameSize`: An Object containing the `width` and `height` of the SWF.
* `frameRate`: The SWF framerate.
* `frameCount`: Number of frames in the SWF.
* `tags`: An array of `tag`. Each item in the array is an object with a `header` property with the folowing properties:
  * `code`: A number indicating the type of the tag. (see [SWF format][swf-format] for more information)
  * `length`: The length of the tag in bytes.

## Running test

To run the test invoke the following command within the repo directory : 

```sh
$ npm test
```

## Todo

* Read Tags' fields. 
* Write in Tags block.

## Contributors

  Author: [Rafael Leal Dias][rdleal-git]

## License

MIT 

[nodejs]: http://www.nodejs.org
[swf-format]: http://wwwimages.adobe.com/content/dam/Adobe/en/devnet/swf/pdf/swf-file-format-spec.pdf
[rdleal-git]: https://github.com/rafaeldias
