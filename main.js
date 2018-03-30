const archiver = require('archiver')
const fs = require('fs')
const klaw = require('klaw')
const path = require('path')
const rimraf = require('rimraf')
const svg2img = require('svg2img')
const through2 = require('through2')

// Filters out directories from Klaw results
const noDir = through2.obj(function (item, enc, next) {
  if (!item.stats.isDirectory()) this.push(item)
  next()
})

// Define commonly used paths
const src = path.join(__dirname, 'src')
const dist = path.join(__dirname, 'dist')

// Define arrays for files
let svgPaths = []
let otherPaths = []

rimraf(dist, error => { if (error) console.log(error) })

klaw(src)
  // Filter out directories
  .pipe(noDir)
  // When a path is found push it to svg or others
  .on('data', file => {
    if (path.extname(file.path).toLowerCase() == '.svg') svgPaths.push(file.path)
    else otherPaths.push(file.path)
  })
  // When Klaw finishes convert the svgs to pngs
  .on('end', () => {
    // If dist directory doesn't exist we should create it
    if (!fs.existsSync(dist)) fs.mkdirSync(dist)
    process.argv.forEach(arg => {
      switch (arg) {
        case '--test':
          svg2img(path.join(src, 'test.svg'), (error, buffer) => {
            if (error) console.log(error)
            fs.writeFileSync(path.join(dist, 'test.png'), buffer)
          })
          break
        case '--build':
          convert({ prod: false })
          break
        case '--prod':
          convert({ prod: true })
          break
      }
    })
  })

function convert(options) {
  let _dist = dist
  if (options.prod) _dist = path.join(dist, 'Mi Skin')
  // If dist directory doesn't exist we should create it
  if (!fs.existsSync(_dist)) fs.mkdirSync(_dist)
  console.log(`Found ${svgPaths.length} SVG and ${otherPaths.length} other files.`)
  console.log('Starting conversion...')
  // Define start time for when we started converting
  let startTime = Date.now()
  // Create counter for total svgs converted
  let svgsConverted = 0
  // Iterate through each path and convert the svg to a png and put it in dist
  svgPaths.forEach(file => {
    svg2img(file, (error, buffer) => {
      if (error) console.log(error)
      fs.writeFileSync(path.join(_dist, `${path.basename(file, '.svg')}.png`), buffer)
      // Count up every time we finish converting an svg
      svgsConverted++
      // When they're all done output total converting time
      if (svgsConverted == svgPaths.length) {
        console.log(`Finished conversion in ${Date.now() - startTime}ms.`)
        // Let's remove test.png since it's not necessary for the skin
        fs.unlinkSync(path.join(_dist, 'test.png'))
        // Also let's remove menu-background.png and convert it to a .jpg
        fs.unlinkSync(path.join(_dist, 'menu-background.png'))
        svg2img(path.join(src, 'home-screen', 'menu-background.svg'), { 'format': 'jpg', 'quality': 100 }, (error, buffer) => {
          if (error) console.log(error)
          fs.writeFileSync(path.join(_dist, 'menu-background.jpg'), buffer)
        })
        if (options.prod) {
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
      }
    })
  })

  // Copy over all the other files
  otherPaths.forEach(file => {
    fs.createReadStream(file).pipe(fs.createWriteStream(path.join(_dist, file.replace(/^.*[\\\/]/, ''))))
  })
}
