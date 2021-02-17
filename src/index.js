const crypto = require('crypto');
const chunk = require('lodash/chunk')
const flatten = require('lodash/flatten')
const readline = require('readline');
const gm = require('gm')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const SQUARE_SIZE = 50;
const IMAGE_SIZE = 250;

const hashInput = str => crypto.createHash('md5').update(str).digest("hex")

const pickColor = hash => {
  const [r, g, b] = hash;
  return `rgba(${r}, ${g}, ${b}, 1)`
}


const buildGrid = hex => {
  const chunks = chunk(hex, 3)
  chunks.pop()
  const mirrorChunks = chunks.map(row => {
    const [first, second] = row;
    return [...row, second, first]
  });

  const flatArray = flatten(mirrorChunks);

  return flatArray.map((code, index) => {
    return {
      code,
      index: index
    }
  });
}

const filterOddSquares = squares => squares.filter(square => square.code % 2 === 0);

const buildPixelMap = squares => {
  return squares.map(square => {
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
  const image = gm(IMAGE_SIZE, IMAGE_SIZE, 'white');
  pixelMap.forEach(pixelSquare => {
    const { topLeft, bottomRight } = pixelSquare
    image.fill(color)
        .drawRectangle(topLeft[0],topLeft[1], bottomRight[0],bottomRight[1])
  });

  const filename = `images/${name}.png`
  image.write(filename, function (err) {
    if (!err) console.log(`${filename} has been created!`);
    console.log(err);
  });
}

const buildImage = async name => {
  const hex = Buffer.from(hashInput(name), 'hex');
  const color = pickColor(hex)
  const grid = buildGrid(hex);

  const evenSquares = filterOddSquares(grid);
  const pixelMap = buildPixelMap(evenSquares);
  await saveImage(pixelMap, color, name)
}

rl.question('What is your name? ', name => {
  buildImage(name)
  rl.close();
});
