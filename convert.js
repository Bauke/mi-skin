const archiver = require('archiver')
const fs = require('fs')
const klaw = require('klaw')
const klawsync = require('klaw-sync')
const path = require('path')
const rimraf = require('rimraf')
const svg = require('svg-to-png')
const through2 = require('through2')

// Define some paths to have less clutter
const src = path.join(__dirname, 'src')
const dist = path.join(__dirname, 'dist')

// Filters out directories from Klaw
const noDir = through2.obj(function (item, enc, next) {
  if (!item.stats.isDirectory()) this.push(item)
  next()
})

rimraf(dist, () => {
  process.argv.forEach((val) => {
    switch (val) {
      case '--test':
        svg.convert(path.join(src, 'test.svg'), dist)
        break
      case '--build':
        createSkin({ prod: false })
        break
      case '--prod':
        createSkin({ prod: true })
        break
    }
  })
})

function createSkin(options) {
  // If prod script is run make the output folder 'dist/MI Skin'
  let _dist = dist
  if (options.prod) _dist = path.join(dist, 'MI Skin')

  // Define arrays for SVG files and other files
  let svgPaths = []
  let otherPaths = []

  klaw(src)
    .pipe(noDir)
    .on('data', file => {
      if (path.extname(file.path) == '.svg') svgPaths.push(file.path)
      else otherPaths.push(file.path)
    })
    .on('end', () => {
      console.log(`${svgPaths.length} SVG files, ${otherPaths.length} other(s).`)
      console.log('Starting SVG to PNG conversion.')
      // Disable console to mute svg-to-png default console logging
      console.log = d => { }
      // Set start time for total time when converting is finished
      let startTime = Date.now()
      svg.convert(svgPaths, _dist)
        .then(() => {
          // Once converting is done we need to enable the console again
          console.log = d => { process.stdout.write(d + '\n') }
          // Log when it's finished
          console.log(`Converting finished in ${(Date.now() - startTime) / 1000}s.`)

          // Remove the test.png that we won't need
          fs.unlinkSync(path.join(_dist, 'test.png'))

          // Copy other files over to dist/
          otherPaths.forEach(file => {
            fs.createReadStream(file).pipe(fs.createWriteStream(path.join(_dist, file.replace(/^.*[\\\/]/, ''))))
          })

          // Change menu-background's extension from jpg to png, doesn't work in some cases
          // fs.renameSync(path.join(_dist, 'menu-background.png'), path.join(_dist, 'menu-background.jpg'))
          // TODO: convert svg to jpg in some way? so for now this won't be a .jpg
          // Possible solution, switch to: https://github.com/fuzhenn/node-svg2img

          // If we want to build for production let's create a .osk for it
          if (options.prod) {
            let zipfile = fs.createWriteStream(path.join(dist, 'MI Skin.zip'))
            let archive = archiver('zip', { zlib: { level: 9 } })

            archive
              .on('warning', err => {
                if (err.code === 'ENOENT') {
                  console.log(err)
                } else {
                  throw err
                }
              })
              .on('error', err => {
                throw err
              })

            // Open pipe to archive data to file
            archive.pipe(zipfile)
            // Append files from a directory and put the the contents at the root of the archive
            archive.directory(_dist, false)
            archive.finalize()
            // Rename the .zip to .osk so we can easily open it with osu!
            fs.renameSync(path.join(dist, 'MI Skin.zip'), path.join(dist, 'MI Skin.osk'))
          }
        })
    })
}

function createSkinOld(prod) {
  let _dist = dist
  if (prod) {
    _dist = path.join(dist, 'MI Skin')
  }
  // Create array to hold file paths from klaw-sync
  let files = []
  // Push file paths into files array
  klawsync(src, { nodir: true }).forEach(file => {
    files.push(file.path)
  })
  // Filter out only files that have svg as extension into new array
  let svgs = files.filter(file => file.substring(file.length - 4) === '.svg')
  svg.convert(svgs, _dist)
    .then(() => {
      // Now there are other files that still have to be copied to dist so we filter out all .svg files
      files = files.filter(file => file.substring(file.length - 4) !== '.svg')
      files.forEach(file => {
        fs.createReadStream(file).pipe(fs.createWriteStream(path.join(_dist, file.replace(/^.*[\\\/]/, ''))))
      })
      // And there is menu-background which needs to be a .jpg file so let's rename that too.
      // In my tests renaming .png to .jpg files have worked fine but I'm not sure on the effects it might have, there is probably a better way to do this.
      fs.renameSync(path.join(_dist, 'menu-background.png'), path.join(_dist, 'menu-background.jpg'))
      // Because it will convert all .svgs to .png we want to remove the test.svg we included
      fs.unlinkSync(path.join(_dist, 'test.png'))
      if (prod) {
        let zipfile = fs.createWriteStream(path.join(dist, 'MI Skin.zip'))
        let archive = archiver('zip', { zlib: { level: 9 } })

        archive.on('warning', (err) => {
          if (err.code === 'ENOENT') {
            console.log(err)
          } else {
            throw err
          }
        })

        archive.on('error', (err) => {
          throw err
        })

        // Open pipe to archive data to file
        archive.pipe(zipfile)
        // Append files from a directory and put the the contents at the root of the archive
        archive.directory(_dist, false)
        archive.finalize()
        // Rename the .zip to .osk so we can easily open it with osu!
        fs.renameSync(path.join(dist, 'MI Skin.zip'), path.join(dist, 'MI Skin.osk'))
      }
    })
}
