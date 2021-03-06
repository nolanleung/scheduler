'use strict'

const db = require('./lib/db')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')

/**
 * CLI Args:
 *  -c [/path/to/conf], --config [/path/to/conf] == Specify custom config file, if no path, copies default config to current directory
 */

const CONFIG_FILENAME = 'config.json'
const cmds = {
    '-h':       'help',
    '--help':   'help',
    '-?':       'help',
    '-c':       'config',
    '--config': 'config',
    '-o':       'out',
    '--out':    'out'
}
const dir = path.dirname(process.argv[1])
const cwd = process.cwd()

let args = {}

// Get command line arguments
if (process.argv.length > 2) {
    let argv = process.argv
    for (let i = 2; i < argv.length; ++i) {
        let cmd = cmds[argv[i]]
        if (cmd) {
            args[cmd] = (argv[i+1] && argv[i+1][0] !== '-') ? argv[i+1] : null
        }
    }
} else {
    return loadConfig(path.join(dir, CONFIG_FILENAME))
}

if (args.help !== undefined) {
    let v = require('./package.json').version
    console.log(`Event Server - ${v}`)
    console.log('Dynamic event scheduling system')
    console.log('')
    console.log('Usage: event-server [-c [ PATH | [-o PATH] ] ]')
    console.log('')
    console.log('Options:')
    console.log('-?, -h, --help         Show help')
    console.log('-c, --config [path?]   If path is specified, loads custom config file.')
    console.log('                       If not, makes a copy of the default config file in the current directory.')
    console.log('-o, --out              Destination for config file generated by -c, --config')
    console.log('                       Example: event-server -c -o ~/event-server/conf.json')
    return
} else if (args.config === null) {
    copyConfig(args.out)
} else if (args.config) {
    loadConfig(args.config)
} else {
    loadConfig(path.join(dir, CONFIG_FILENAME))
}

function copyConfig(_path = CONFIG_FILENAME) {
    if (!path.isAbsolute(_path)) _path = path.join(cwd, _path)
    let format = path.parse(_path)
    let _dir
    
    if (format.ext){
        _dir = format.dir
    } else {
        _dir = _path
        _path = path.join(_path, CONFIG_FILENAME)
    }
    
    mkdirp.sync(_dir)
    fs.createReadStream(path.join(dir, CONFIG_FILENAME)).pipe(fs.createWriteStream(_path))
}

function loadConfig(_path) {
    if (_path && !path.isAbsolute(_path)) _path = path.join(cwd, _path)
    fs.readFile(_path || CONFIG_FILENAME, (err, data) => {
        if (err) throw err
        let config = JSON.parse(data)
        start(config)
    })
}

function start(options) {
    db.init(options, () => {
        const Server = require('./lib/server')
	    new Server(options).start()
    })
}
