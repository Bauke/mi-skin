const fs = require('fs')
const klaw = require('klaw-sync')
const path = require('path')
const rimraf = require('rimraf')
const svg = require('svg-to-png')

// Define some paths to have less clutter
const src = path.join(__dirname, 'src')
const dist = path.join(__dirname, 'dist')

rimraf(dist, () => {
  process.argv.forEach((val) => {
    switch (val) {
      case '--test':
        svg.convert(path.join(src, 'test.svg'), dist)
        break
      case '--build':
        createSkin(false)
        break
      case '--prod':
        createSkin(true)
        break
    }
  })
})

function createSkin(prod) {
  let _dist = dist
  if (prod) {
    _dist = path.join(dist, 'MI Skin')
  }
  // Create array to hold file paths from klaw-sync
  let files = []
  // Push file paths into files array
  klaw(src, { nodir: true }).forEach(file => {
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
    })
}
