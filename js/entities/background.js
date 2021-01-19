// @flow

const {getBackgroundSprite} = require('../selectors/sprites');
const {makeEntity} = require('./makeEntity');

const config = {
  notOccupying: true, // when creating entities w/marquee, they can go on top of this
  // notBlockingPutdown: true, // when putting down entities, they can go on top of this
  notAnimated: true,
};

const make = (
  game: Game,
  position: Vector,
	width: ?number,
	height: ?number,
  name: string,
): Background => {
	return {
    ...makeEntity('BACKGROUND', position, width, height),
    ...config,
    name,
  };
};

const render = (ctx, game, tile): void => {
  let obj = getBackgroundSprite(game, tile);
  if (obj == null || obj.img == null) return;
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.drawImage(
    obj.img,
    obj.x, obj.y, obj.width, obj.height,
    tile.position.x, tile.position.y,
    tile.width, tile.height,
  );
  ctx.restore();
};

module.exports = {
  make, render, config,
};
