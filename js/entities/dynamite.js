// @flow

const {makeEntity} = require('./makeEntity');
const {getInterpolatedIndex} = require('../selectors/sprites');
const {getDuration} = require('../simulation/actionQueue');
const globalConfig = require('../config');

/**
 *  Explosives explode when they die. They can be killed by
 *  running out of hp or by having an age (in ms) greater than their timer
 *  time (set timer to null if you don't want it to do this).
 */

const config = {
  isExplosive: true,
  hp: 1,
  width: 1,
  height: 1,
  explosionRadius: 5,
  damage: 4,
  timer: 1500,
  age: 0,
  blockingTypes: [
    'FOOD', 'DIRT', 'AGENT',
    'STONE', 'DOODAD', 'WORM',
  ],

  DIE: {
    duration: 300,
    effectIndex: 250,
    spriteOrder: [0],
  }
};

const make = (
  game: Game,
  position: Vector,
  playerID,
): Dynamite => {
  return {
    ...makeEntity('DYNAMITE', position, config.width, config.height),
    ...config,
    playerID,
    prevHP: config.hp,
    prevHPAge: 0,
    actions: [],
    task: null,
  };
};

const render = (ctx, game, dynamite): void => {
  ctx.save();
  const curAction = dynamite.actions[0];
  ctx.translate(dynamite.position.x, dynamite.position.y);
  ctx.strokeStyle = 'black';
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, dynamite.width, dynamite.height);
  ctx.strokeRect(0, 0, dynamite.width, dynamite.height);

  // explosion itself
  if (curAction != null && curAction.type == 'DIE') {
    const duration = getDuration(game, dynamite, curAction.type);
    const index = getInterpolatedIndex(game, dynamite);
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    const radius = index/duration * dynamite.explosionRadius;
    ctx.arc(
      dynamite.width / 2,
      dynamite.height / 2,
      radius, 0, Math.PI * 2,
    );
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
};

module.exports = {config, make, render};
