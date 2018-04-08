// Define dependencies
const archiver = require('archiver')
const fs = require('fs')
const klaw = require('klaw')
const path = require('path')
const rimraf = require('rimraf')
const sizeOf = require('image-size')
const shell = require('shelljs')
const svgToImg = require('svg-to-img')
const through2 = require('through2')

// Define commonly used paths
const src = path.join(__dirname, 'src')
const dist = path.join(__dirname, 'dist')

// Define arrays for the paths
let svgPaths = []
let otherPaths = []

// Define filter for Klaw
const noDir = through2.obj(function (item, enc, next) {
  if (!item.stats.isDirectory()) this.push(item)
  next()
})

// Rimraf the dist folder (rimraf = 'rm -rf', deletes the directory entirely)
rimraf(dist, (error) => {
  // If there's an error with Rimraf, throw it
  if (error) throw error
  // Else just continue
  else {
    // Define another const for dist/MI Skin
    const _dist = path.join(dist, 'MI Skin')
    // Make sure both dist and dist/MI Skin exist
    if (!fs.existsSync(dist)) fs.mkdirSync(dist)
    if (!fs.existsSync(_dist)) fs.mkdirSync(_dist)
    // Klaw through src
    klaw(src)
      // Filter out directories
      .pipe(noDir)
      // If there's an error log it and show the file that's causing it
      .on('error', (error, file) => {
        console.log(error.message)
        console.dir(file.path)
      })
      // When there's a file to add check if it's an SVG and add it to svgPaths
      // Otherwise add it to otherPaths (files such as skin.ini and README.md)
      .on('data', (file) => {
        if (path.extname(file.path) == '.svg') {
          svgPaths.push(file.path)
        } else {
          otherPaths.push(file.path)
        }
      })
      // When Klaw finishes...
      .on('end', () => {
        // ... iterate through otherPaths and copy them to dist/MI Skin
        otherPaths.forEach((file) => {
          fs.copyFileSync(file, path.join(_dist, path.basename(file)))
        })

        // Define a variable to count up with in the forEach
        // Could probably just use a regular for (let i = 0; ...) loop but this works too
        let svgCounter = 0

        // ... iterate through svgPaths and convert them
        svgPaths.forEach((file) => {
          // Menu-background needs to be a JPEG, all the rest can be PNG
          if (path.basename(file, '.svg') == 'menu-background') {
            // Read the file
            fs.readFile(file, { encoding: 'utf-8' }, async (error, data) => {
              // With the data buffer convert it to a JPEG
              await svgToImg.from(data).to({
                type: 'jpeg',
                path: path.join(_dist, path.basename(file, '.svg') + '.jpeg')
              }).catch((result) => {
                // Catch any errors from converting
                console.log(result)
              }).then(() => {
                // When the converting finishes count up by one
                svgCounter++
              })
            })
          } else {
            // Read the file
            fs.readFile(file, { encoding: 'utf-8' }, async (error, data) => {
              // Create a let for the output path
              let outputPath = path.join(_dist, path.basename(file, '.svg') + '.png')
              if (file.includes('extras')) {
                // If the file is located under extras in src
                // Change the output path so it's it'll be in dist/MI Skin/Extras/...
                outputPath = path.join(_dist, 'Extras', path.dirname(file.substring(file.indexOf('extras') + 7, file.length)), path.basename(file, '.svg') + '.png')
                if (!fs.existsSync(outputPath)) shell.mkdir('-p', path.dirname(outputPath))
              }
              // With the data buffer convert it to a PNG
              await svgToImg.from(data).to({
                type: 'png',
                path: outputPath
              }).catch((result) => {
                // Catch any errors from converting
                console.log(result)
              }).then(async () => {
                // When the converting finishes get the size of the file ...
                const dimensions = sizeOf(file)
                // ... and convert it again, this time being twice the resolution (for HD version)
                // for the outputPath we also want to change the filename at the end to @2x.png, because it's the HD version ofcourse
                await svgToImg.from(data).to({
                  type: 'png',
                  path: outputPath.substring(0, outputPath.length - 4) + '@2x.png',
                  width: dimensions.width * 2,
                  height: dimensions.height * 2
                })
                // Count up by one again
                svgCounter++
                // If the counter is equal to the amount of svgPaths, all the files have been converted
                if (svgCounter == svgPaths.length) {
                  // We have a test.svg for testing the package functionality, so let's delete those here
                  // Both SD and HD versions ofcourse
                  fs.unlinkSync(path.join(_dist, 'test.png'))
                  fs.unlinkSync(path.join(_dist, 'test@2x.png'))

                  // And finally create archiver consts to create the .zip, which will then just be renamed to .osk
                  // As far as I'm aware a .osk is just a renamed .zip. I've not had any issues with it ever so should be fine, hopefully
                  const output = fs.createWriteStream(path.join(dist, 'MI Skin.zip'))
                  const archive = archiver('zip', { zlib: { level: 9 } })

                  archive.pipe(output)
                  archive.directory(_dist, false)
                  // When the archive finalizes rename the .zip to .osk
                  archive.finalize().then(() => {
                    fs.renameSync(path.join(dist, 'MI Skin.zip'), path.join(dist, 'MI Skin.osk'))
                  })
                }
              })
            })
          }
        })
      })
  }
})
