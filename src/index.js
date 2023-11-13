const { WriteStream, ReadStream, createWriteStream, createReadStream } = require(`fs`)
const { spawn } = require(`child_process`)
const { Writable, Readable } = require(`stream`)

/**
 * @typedef {Object} quick-ffmpeg-options
 * @param {Object} opts - Options for handling ffmpeg.
 * @param {String|Buffer|Readable|ReadStream} opts.input - The input, either String (absolute file path), Buffer, ReadableStream, or ReadStream.
 * @param {String|Array} opts.args - The arguments to pass to ffmpeg, either String (arguments should be separated with spaces) or Array.
 * @param {String|Writable|WriteStream|undefined} [opts.output] - The output, either String (absolute file path), WritableStream, or WriteStream. The output is optional, if not specified, the promise will resolve with the full output as a Buffer.
 * @param {Boolean} [opts.verbose=false] - Whether to log ffmpeg's output to the console. Defaults to false.
 * @param {Function} [opts.verboseCallback=console.log] - A callback function to handle ffmpeg's output, if verbose is false and verboseCallback is specified, verboseCallback will *not* be called. *The data passed to the callback is in Buffer form, not string*.
 * @param {String} [opts.path=ffmpeg] - The path to ffmpeg, defaults to `ffmpeg` (required if ffmpeg is not in your path).
 * @returns 
 */
const ff = (opts) => new Promise((resolve, reject) => {
    let { input, args, output, verbose, verboseCallback, path } = opts

    if (!input || !args) return reject(`Missing input or args.`)
    if (module.exports.path && !path) path = module.exports.path
    
    if (Array.isArray(args)) args = args.join(` `)
    args = args.split(` `)
    if (args.includes(`-i`)) return reject(`The input and output ffmpeg argument is disallowed as the package will specify those, please use the input option instead.`)
    
    let extraArgs = []
    if (output instanceof Writable || output instanceof WriteStream || !output) extraArgs = [`-movflags`, `frag_keyframe+empty_moov`]
    args = [`-i`, `pipe:0`, ...args, `pipe:1`]

    const f = spawn(path ?? `ffmpeg`, args)
    f.on(`error`, reject)

    // handle verbosity
    if (verbose) {
        console.log(`Verbose setting on.`, `\n`, `Running command:`, `\n`, `${path ?? `ffmpeg`} ${args.join(` `)}`)
        if (verboseCallback) f.stderr.on(`data`, verboseCallback)
        else f.stderr.on(`data`, (data) => console.log(data.toString()))
    }
    
    // prep output
    if (typeof output == `string`) {
        f.stdout.pipe(createWriteStream(output))
        
        f.on(`close`, resolve)
    } else if (output instanceof Writable || output instanceof WriteStream) {
        f.stdout.pipe(output)

        f.on(`close`, resolve)
    } else if (!output) {
        const chunks = []

        f.stdout.on(`data`, (data) => chunks.push(data))
        f.on(`close`, () => resolve(Buffer.concat(chunks)))
    }

    // start input
    if (typeof input == `string`) {
        const s = createReadStream(input)
        s.pipe(f.stdin)

        s.on(`end`, () => f.stdin.end())
    } else if (input instanceof Buffer) {
        f.stdin.write(input)
        f.stdin.end()
    } else if (input instanceof Readable || input instanceof ReadStream) input.pipe(f.stdin)
})

module.exports = {
    ff,
    
    path: `ffmpeg`,
    setPath: (path) => module.exports.path = path,
}