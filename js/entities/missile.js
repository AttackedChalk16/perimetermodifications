// @flow

const {add} = require('../utils/vectors');
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
  damage: 10,
  hp: 10,
  width: 1,
  height: 2,
  velocity: 50,
  blockingTypes: [
    'DIRT', 'STONE', 'FOOD', 'AGENT',
    'DOODAD', 'WORM',
    'FAST_TURRET', 'TURBINE',
    'IRON', 'STEEL', 'COAL',
    'BASIC_TURRET', 'LASER_TURRET',
    'BASE',
  ],

  DIE: {
    duration: 1,
    spriteOrder: [0],
  },
};

const make = (
  game: Game,
  position: Vector,
  playerID: PlayerID,
  warhead: ?Entity,
  theta: Radians,
  velocity: ?number,
  targetID: ?EntityID,
): Missile => {
  return {
    ...makeEntity('MISSILE', position, config.width, config.height),
    ...config,
    holding: null,
    holdingIDs: [],
    warhead,
    playerID,

    // required for ballistics
    age: 0,
    actions: [],
    theta,
    velocity: velocity != null ? velocity : config.velocity,
    initialPosition: {...position},
    ballisticPosition: {...position},
    ballisticTheta: theta,
    initialTheta: theta,

    targetID,

    prevPositions: [add(position, {x: config.width / 2, y: config.height / 2})],
  };
};

const render = (ctx, game, missile): void => {
  ctx.save();
  const {
    width, height, theta,
    ballisticTheta,
    ballisticPosition, prevPositions,
  } = missile;
  const position = ballisticPosition;

  // trace out the trajectory
  ctx.strokeStyle = 'black';
  ctx.beginPath();
  ctx.moveTo(position.x + width / 2, position.y + height / 2);
  for (let i = prevPositions.length - 1; i >= 0; i--) {
    ctx.lineTo(prevPositions[i].x, prevPositions[i].y);
  }
  ctx.stroke();

  ctx.translate(
    position.x + width / 2,
    position.y + height / 2,
  );
  ctx.rotate(ballisticTheta + Math.PI / 2);
  ctx.translate(-width / 2, -height / 2);

  ctx.strokeStyle = 'black';
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, missile.width, missile.height);
  ctx.strokeRect(0, 0, missile.width, missile.height);

  ctx.restore();
};

module.exports = {config, make, render};
