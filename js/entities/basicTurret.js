// @flow

const {makeEntity}= require('./makeEntity.js');
const {add, subtract, equals, makeVector, vectorTheta} = require('../utils/vectors');
const {renderAgent} = require('../render/renderAgent');

const config = {
  isTower: true,
  hp: 30,
  width: 1,
  height: 1,
  damage: 10,
  thetaAccel: 0.00005,
  minTheta: 0.2,
  maxTheta: Math.PI - 0.2,
  maxThetaSpeed: 0.04,

  // action overrides
  DIE: {
    duration: 2,
    spriteOrder: [0],
  },
  SHOOT: {
    duration: 1000,
    spriteOrder: [0],
  },

  cost: {
    IRON: 4,
  }

};

const make = (
  game: Game,
  position: Vector,
  playerID: PlayerID,
  projectileType: ?EntityType,
  fireRate: ?number,
  name: ?String,
  theta: ?number,
): Tower => {
  const configCopy = {...config};
  if (fireRate != null) {
    configCopy.SHOOT = {
      ...configCopy.SHOOT,
      duration: fireRate,
    }
  }
  return {
    ...makeEntity('BASIC_TURRET', position, config.width, config.height),
    ...configCopy,
    playerID,

    name: name != null ? name : 'Basic Turret',

    // angle of the turret
    theta: theta != null ? theta : config.minTheta,
    thetaSpeed: 0,
    thetaAccel: 0,

    // what the tower wants to aim at
    targetID: null,

    projectileType: projectileType != null ? projectileType : 'BULLET',

    actions: [],


  };
};

const render = (ctx, game, turret): void => {
  const {position, width, height, theta} = turret;
  ctx.save();
  ctx.translate(
    position.x, position.y,
  );

  // barrel of turret
  ctx.save();
  ctx.fillStyle = "black";
  const turretWidth = 1.5;
  const turretHeight = 0.3;
  ctx.translate(width / 2, height / 2);
  ctx.rotate(theta);
  ctx.translate(-1 * turretWidth * 0.75, -turretHeight / 2);
  ctx.fillRect(0, 0, turretWidth, turretHeight);
  ctx.restore();

  // base of turret
  ctx.strokeStyle = "black";
  ctx.fillStyle = "steelblue";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeRect(0, 0, width, height);


  ctx.restore();
};

const turretConfigs = {
  basic: {
    name: 'Basic Turret',
    fireRate: 1000,
    projectileType: 'BULLET',
    cost: {
      IRON: 4,
    },
    isPowerConsumer: false,
    powerConsumed: 0,
  },

  fast: {
    name: 'Fast Turret',
    fireRate: 150,
    projectileType: 'BULLET',
    cost: {
      STEEL: 4,
    },
    isPowerConsumer: true,
    powerConsumed: 1,
  },
}


module.exports = {
  make, render, config, turretConfigs,
};
