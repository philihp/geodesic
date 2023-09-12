const path = require('path')

module.exports = {
  '*.{js,jsx,ts,tsx}': [
    (filenames) => `next lint --fix --file ${filenames.map((f) => path.relative(process.cwd(), f)).join(' --file ')}`,
  ],
}
