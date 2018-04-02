// This file is for testing the svg-to-img package.
// If you're developing you should run 'yarn test' before starting to make sure you can convert properly.
// It will create 5 test_n.png and 5 test_n.jpeg files in the dist folder. They should all look identical.

// Define dependencies
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const svgToImg = require('svg-to-img')
const through2 = require('through2')

// Define commonly used paths
const src = path.join(__dirname, 'src')
const dist = path.join(__dirname, 'dist')

// Define test.svg path
const testSVG = path.join(src, 'test.svg')

// Completely remove the dist folder and run testConvert function if there's no error
rimraf(dist, (error) => {
  if (error) throw error
  else testConvert()
})

function testConvert() {
  // Read the testSVG contents
  fs.readFile(testSVG, async (error, buffer) => {
    // If there's no error reading the file
    if (error) throw error
    else {
      // Check if the dist folder exists, if it doesn't make it
      if (!fs.existsSync(dist)) fs.mkdirSync(dist)

      // Then iterate through 5 .png conversions
      for (let i = 0; i <= 5; i++) {
        await svgToImg.from(buffer).to({
          type: 'png',
          path: path.join(dist, `test_${i}.png`)
        })
      }

      // and 5 .jpeg conversions
      for (let i = 0; i < 5; i++) {
        await svgToImg.from(buffer).to({
          type: 'jpeg',
          path: path.join(dist, `test_${i}.jpeg`)
        })
      }
    }
  })
}
