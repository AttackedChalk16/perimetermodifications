// @flow

const {makeEntity}= require('./makeEntity.js');
const {add, subtract, equals, makeVector, vectorTheta} = require('../utils/vectors');
const {renderAgent} = require('../render/renderAgent');

const config = {
  isGenerator: true,
  powerGenerated: 1,
  hp: 15,
  width: 2,
  height: 2,
  maxThetaSpeed: 0.4,
  cost: {
    STEEL: 1,
    SILICON: 1,
    GLASS: 2,
  },
};

const make = (
  game: Game,
  position: Vector,
  playerID: PlayerID,
): Tower => {
  return {
    ...makeEntity('SOLAR_PANEL', position, config.width, config.height),
    ...config,
    playerID,

    theta: Math.PI / 4,

  };
};

const render = (ctx, game, panel): void => {
  const {position, width, height, theta} = panel;
  ctx.save();
	ctx.translate(
    panel.position.x + width / 2,
    panel.position.y + height / 2,
  );
  ctx.rotate(panel.theta);
  ctx.translate(-panel.width / 2, -panel.height / 4);

  // base of panel
  ctx.strokeStyle = "black";
  ctx.fillStyle = "silver";
  ctx.globalAlpha = 0.75;
  ctx.fillRect(0, 0, width, height / 2);
  ctx.strokeRect(0, 0, width, height / 2);

  ctx.restore();
};


module.exports = {
  make, render, config,
};
