// @flow

const {
  getTileSprite,
} = require('../selectors/sprites');
const {makeEntity} = require('./makeEntity');

const config = {
  isTiled: true,
  isMeltable: true,
  pheromoneEmitter: true,
  pheromoneType: 'MOLTEN_STEEL',
  hp: 24,
  meltTemp: 100, // temperature at which you catch on fire
  heatQuantity: 240, // amount of steel  produced when melted
};

const make = (
  game: Game,
  position: Vector,
	width: ?number,
	height: ?number,
): Coal => {
	return {
    ...makeEntity('STEEL', position, width || 1, height || 1),
    ...config,
    dictIndexStr: '',
    playerID: 0, // gaia
    quantity: 0, // amount of pheromone emitted
  };
};

const render = (ctx, game, steel): void => {
  // const obj = getTileSprite(game, steel);
  // if (obj == null || obj.img == null) return;
  // ctx.drawImage(
  //   obj.img,
  //   obj.x, obj.y, obj.width, obj.height,
  //   steel.position.x, steel.position.y, steel.width, steel.height,
  // );

  ctx.fillStyle = "lightgray";
  ctx.fillRect(steel.position.x, steel.position.y, steel.width, steel.height);
}

module.exports = {
  make, render, config,
};
