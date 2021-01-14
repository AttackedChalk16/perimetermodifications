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
  isBallistic: true,
  damage: 1,
  hp: 1,
  width: 1,
  height: 2,
  blockingTypes: [
    'DIRT', 'STONE', 'FOOD', 'AGENT',
    'DOODAD', 'WORM', 'MISSILE',
  ],

  DIE: {
    duration: 1,
    spriteOrder: [0],
  }
};

const make = (
  game: Game,
  position: Vector,
  playerID: PlayerID,
  warhead: ?Entity,
  theta: Radians,
  velocity: number,
): Missile => {
  return {
    ...makeEntity('MISSILE', position, config.width, config.height),
    ...config,
    holding: null,
    holdingIDs: [],
    warhead,
    age: 0,
    theta,
    velocity,
    playerID,
    actions: [],
    initialPosition: {...position},
    ballisticPosition: {...position},
    initialTheta: theta,
    prevPositions: [{...position}],
  };
};

const render = (ctx, game, missile): void => {
  ctx.save();
  const {width, height, theta, ballisticPosition, prevPositions} = missile;
  const position = ballisticPosition;

  // trace out the trajectory
  ctx.strokeStyle = 'black';
  ctx.beginPath();
  ctx.moveTo(position.x, position.y);
  for (let i = prevPositions.length - 1; i >= 0; i--) {
    ctx.lineTo(prevPositions[i].x, prevPositions[i].y);
  }
  ctx.stroke();

  ctx.translate(
    position.x + width / 2,
    position.y + height / 2,
  );
  ctx.rotate(theta - 3 * Math.PI / 2);
  ctx.translate(-width / 2, -height / 2);

  ctx.strokeStyle = 'black';
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, missile.width, missile.height);
  ctx.strokeRect(0, 0, missile.width, missile.height);

  ctx.restore();
};

module.exports = {config, make, render};
