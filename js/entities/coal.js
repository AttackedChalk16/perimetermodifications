// @flow

const {
  getTileSprite,
} = require('../selectors/sprites');
const {makeEntity} = require('./makeEntity');

const config = {
  isTiled: true,
  isFlammable: true,
  pheromoneEmitter: true,
  pheromoneType: 'HEAT',
  hp: 1,
  combustionTemp: 100, // temperature at which you catch on fire
  fuel: 3 * 60 * 1000, // ms of burn time
  heatQuantity: 120, // amount of heat produced when on fire
};

const make = (
  game: Game,
  position: Vector,
	width: ?number,
	height: ?number,
): Coal => {
	return {
    ...makeEntity('COAL', position, width || 1, height || 1),
    ...config,
    dictIndexStr: '',
    onFire: false,
    playerID: 0, // gaia
    quantity: 0, // amount of pheromone emitted
  };
};

const render = (ctx, game, coal): void => {
  // const obj = getTileSprite(game, coal);
  // if (obj == null || obj.img == null) return;
  // ctx.drawImage(
  //   obj.img,
  //   obj.x, obj.y, obj.width, obj.height,
  //   coal.position.x, coal.position.y, coal.width, coal.height,
  // );

  ctx.fillStyle = "black";
  ctx.fillRect(coal.position.x, coal.position.y, coal.width, coal.height);

  if (coal.onFire) {
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(coal.position.x, coal.position.y, coal.width, coal.height);
  }
}

module.exports = {
  make, render, config,
};