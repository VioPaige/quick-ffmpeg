# FFmpeg Node.js interface `quick-ffmpeg`

This package is a very down-to-earth simplistic Node.js interface for the FFmpeg command line tool. FFprobe support is coming soon but is *not* available yet.

If there are any features missing, please let me know on the [issues page](https://github.com/VioPaige/quick-ffmpeg/issues)!

## Installation

### Package
```sh
$ npm install quick-ffmpeg
```

### FFmpeg
Make sure to install [ffmpeg](http://www.ffmpeg.org) or use a package like [ffmpeg-static](https://www.npmjs.com/package/ffmpeg-static) in order to use this module.


## Usage

### Examples
You can find examples [below](#advanced-usage).

### Running a command
The `quick-ffmpeg` package returns a simple function that wraps the FFmpeg command line tool, it can be imported like so:
```js
const ff = require(`quick-ffmpeg`)
```
The function `ff` that we just imported has one parameter which is an `Object` with a number of options. A very simplistic example of how it could be used is changing the format of a video from `.mov` to `.mp4`.

*Note: the `ff` function returns a `Promise`*
```js
const ff = require(`quick-ffmpeg`)
const path = require(`path`)

ff({
    input: path.join(__dirname, `video.mov`),
    args: `-f mp4`, // note that you should exclude the input and output arguments
    output: path.join(__dirname, `video.mp4`),
    verbose: false,
})
```
## Advanced usage
### path
The `path` option can be used to specify a path to an FFmpeg binary, which can be either in your path, your file system, or dynamically imported. Some examples are shown below

```js
const ffPath = require(`ffmpeg-static`)

// Dynamically imported FFmpeg
ff({
    path: ffPath
    // for the sake of simplicity, the other parameters will be left out of the examples
})

// Example of full path being used
ff({
    path: `C:\\Program Files\\ffmpeg\\bin\\ffmpeg`
})

// Example assuming you have ffmpeg in your file path, useless in practice since the path defaults to ffmpeg.
ff({
    path: `ffmpeg`
})
```

### input
The `input` option can be more than just a file path string! Here are a few examples for the possible values of the `input` option.  

```js
const { readFileSync, createReadStream } = require(`fs`)
const { Readable } = require(`stream`)

// String:
ff({
    input: path.join(__dirname, `video.mov`)
})

// Buffer:
ff({
    input: readFileSync(`video.mov`)
})

// ReadStream
ff({
    input: createReadStream(`video.mov`)
})

// ReadableStream
ff({
    input: Readable.from(readFileSync(`video.mov`))
})
```

### args
The `args` option can be either an array or a string containing the arguments to pass to FFmpeg. The arguments cannot include the `-i` argument (cannot include any input or output arguments), the input and output are handled by `quick-ffmpeg`. Here are a few examples of options you could pass.

*Note: Do not pass quotes around a parameter value, these are normally removed by `cmd` before passing to the program, and will make FFmpeg fail while parsing the arguments*
```js
ff({
    args: `-movflags frag_keyframe+empty_moov -filter:v framestep=2,setpts=0.5*PTS -f mp4`
})

ff({
    args: `-filter:a atempo=2 -f mp3`
})

f({
    args: `-filter:v scale=w=1920:h=1080 -f avi`
})
```

### output
The `output` option can also be a multitude of types (and is actually optional). Here are some examples.

*Note: In the situation that you use a Buffer, WriteStream, or WritableStream as output, make sure to include the argument `-movflags frag_keyframe+empty_moov` if outputting to a format that is not streamable, for example mp4*.
```js
const { createWriteStream, writeFileSync } = require(`fs`)
const { Writable } = require(`stream`)

// String:
ff({
    output: path.join(__dirname, `video.mp4`)
})

// WriteStream:
ff({
    output: createWriteStream(`video.mp4`)
})

// WritableStream:
const chunks = []
ff({
    output: Writable({
        write (chunk, encoding, callback) {
            chunks.push(chunk)
            callback()
        }
    })
})

// Excluded
let bfr = ff({})
writeFileSync(`video.mp4`, bfr)
```

### verbosity
The `verbose` and `verboseCallback` options can be used to retrieve or log ffmpeg output (`verbose` defaults to false). Some examples are below.

*Note: output is passed to the verboseCallback in form of `Buffer`s, not strings.*
```js
// Logs all ffmpeg output to the console
ff({
    verbose: true
})

// Saves all ffmpeg output to a text file
const output = [];
(async () => {
    const command = await ff({
        input: path.join(__dirname, `video.mov`),
        args: `-f mp4`,
        output: path.join(__dirname, `video.mp4`),
        verbose: true,
        verboseCallback: (data) => output.push(data.toString())
    }).then(() => true).catch(console.log)

    if (command) writeFileSync(`log.txt`, output.join(`\n`))
})()
```

## Contributions
Contributions are always welcome! Feel free to send pull requests to correct/improve/add things!

## License
The license is to be found in the `LICENSE` file.