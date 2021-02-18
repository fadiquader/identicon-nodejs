const crypto = require('crypto');
const readline = require('readline');
const chunk = require('lodash/chunk')
const flatten = require('lodash/flatten')
const gm = require('gm')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const SQUARE_SIZE = 50;
const IMAGE_SIZE = 250;

const hashStr = str => crypto.createHash('md5').update(str).digest("hex")

/**
 *
 * @param hexBinary: Buffer or Array
 * @returns {string}
 */
const pickColor = hexBinary => {
  const [r, g, b] = hexBinary;
  return `rgb(${r}, ${g}, ${b})`
}

/**
 *
 * @param hexBinary: Buffer or Array
 * @returns {Array}
 */
const buildGrid = hexBinary => {

  const chunks = chunk(hexBinary, 3) // ex: [[5, 6, 7], [...], ..., [20]]
  chunks.pop() // pop the last element
  const mirrorChunks = chunks.map(row => {
    const [first, second] = row;
    return [...row, second, first]; // ex: [[5, 6, 7, 6, 5], [...], ...]
  });

  // ex: [{code: 5, index: 0}, {code: 6, index: 1}, {code: 7, index: 2}...]
  const flatArray = flatten(mirrorChunks);

  return flatArray.map((code, index) => {
    return {
      code,
      index: index
    }
  });
}

/**
 * @param squares: Array<{code: number, index: number}
 * @returns {Array<{code: number, index: number}>}
 */
const filterOddSquares = squares => squares.filter(square => square.code % 2 === 0);

/**
 * calculate the dimensions for even squares
 * @param evenSquares
 * @returns {Array<{topLeft: Array<number>, bottomRight: Array<number>}>}
 */
const buildPixelMap = evenSquares => {
  return evenSquares.map(square => {
    const { index } = square;
    const horizontal = (index % 5) * SQUARE_SIZE;
    const vertical = Math.floor(index / 5) * SQUARE_SIZE;
    return {
      topLeft: [horizontal, vertical],
      bottomRight: [horizontal + SQUARE_SIZE, vertical + SQUARE_SIZE]
    }
  })
}

const saveImage = async (pixelMap, color, name) => {
  const image = gm(IMAGE_SIZE, IMAGE_SIZE, '#F0F0F0');
  pixelMap.forEach(pixelSquare => {
    const { topLeft, bottomRight } = pixelSquare
    image
        .fill(color)
        .drawRectangle(topLeft[0], topLeft[1], bottomRight[0], bottomRight[1])
  });

  const filename = `images/${name}.png`
  image.write(filename, err => {
    if (err) {
      console.log(err);
      process.exit(0);
    } else {
      console.log(`${filename} has been created!`);
    }

  });
}

const buildImage = async name => {
  /**
   *  MD5 generates a string of 32 characters (16 bytes, 128 bits)
   *  Each hex digit reflects a 4-bit binary sequence.
   */
  const hexStr = hashStr(name);

  /**
   *  Buffer is designed to handle raw binary data.
   *  Buffers act somewhat like arrays of integers.
   * The integers in a buffer each represent a byte and so are limited to values from 0 to 255 inclusive
   */
  const hexBinary = Buffer.from(hexStr, 'hex'); // ex:  <Buffer 7e d9 1a c6 7c b4 33 04 41 7c bd 33 93 8f a3 0c>
  // hex to decimal converter https://www.rapidtables.com/convert/number/hex-to-decimal.html

  // rgb(r, g, b)
  const color = pickColor(hexBinary);
  // [{code: 5, index: 0}, {code: 6, index: 1}, {code: 7, index: 2}...]
  const grid = buildGrid(hexBinary);
  // [{code: 6, index: 1}, ...]
  const evenSquares = filterOddSquares(grid);
  // [{topLeft: [50, 50], bottomRight: [100, 100]}, ...]
  const pixelMapArray = buildPixelMap(evenSquares);
  await saveImage(pixelMapArray, color, name)
}

const readFromConsole = () => {
  rl.question('What is your name? ', async answer => {
    const name = answer.trim();

    if (!name) {
      readFromConsole();
    } else {
      await buildImage(name);
      rl.close();
    }
  });
};

readFromConsole();
