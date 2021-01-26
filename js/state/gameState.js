// @flow

const {
  makeAnt, makeDirt, makeEntity,
  makeToken,
} = require('../entities/makeEntity');
const {addEntity, removeEntity} = require('../simulation/entityOperations');
const {add, subtract} = require('../utils/vectors');
const {initGrid, lookupInGrid} = require('../utils/gridHelpers');
const {randomIn} = require('../utils/stochastic');
const {Entities} = require('../entities/registry');
const {config} = require('../config');

import type {Game} from '../types';

// -----------------------------------------------------------------------
// player and colony initialization
// -----------------------------------------------------------------------

const initPlayer = (
  type: 'HUMAN' | 'COMPUTER', id: number, name: string,
): {player: Player, base: Base} => {
  return {
    player: {
      id,
      name,
      type,
    },
    base: {
      resources: {},
      taskNeed: {},
    },
  }
}

// -----------------------------------------------------------------------
// base state
// -----------------------------------------------------------------------

const initBaseState = (
  gridSize: Vector, numPlayers: number,
): Game => {
  const gridWidth = gridSize.x;
  const gridHeight = gridSize.y;
  const game = {
    time: 0,
    players: {},
    bases: {},
    gameID: 0,
    playerID: 1,
    gaiaID: 0,
    numPlayers,

    // for tracking game time
    prevTickTime: 0,
    totalGameTime: 0,
    timeSinceLastTick: 0,

    pheromoneDisplay: {
      COLONY: false,
      ALERT: false,
      WATER: true,
      STEAM: true,
      HEAT: true,
      MOLTEN_IRON: true,
      MOLTEN_STEEL: true,
      SAND: true,
      MOLTEN_SAND: true,
    },
    maxMinimap: false,

    sprites: {},

    gridWidth,
    gridHeight,
    grid: initGrid(gridWidth, gridHeight, numPlayers),
    viewPos: {x: 0, y: 0},
    viewWidth: config.viewWidth,
    viewHeight: config.viewHeight,
    viewImage: {
      canvas: null,
      imgPos: {x:0, y: 0},
      stalePositions: {},
      isStale: true,
      allStale: true,
    },

    nextID: 1,
    entities: {},
    markedDirtIDs: [],
    dirtPutdownPositions: [],

    // entities treated specially
    focusedEntity: null,
    controlledEntity: null,

    pauseMissiles: false,

    staleTiles: [],
    floodFillSources: [],
    reverseFloodFillSources: [],
    dispersingPheromonePositions: [],
    pheromoneWorker: new Worker('bin/pheromoneWorker.js'),

    keepMarquee: false,
    mouseMode: 'COLLECT',
    placeType: null,
    mouse: {
      isLeftDown: false,
      isRightDown: false,
      downPos: {x: 0, y: 0},
      curPos: {x: 0, y: 0},
      curPixel: {x: 0, y: 0},
      prevPixel: {x: 0, y: 0},
    },
    hotKeys: {
      onKeyDown: {},
      onKeyPress: {},
      onKeyUp: {},
      keysDown: {},
    },

    clipboard: {position: {x: 0, y: 0}, width: 1, height: 1},

    // give the timestamp that the tutorial modal was triggered,
    // if null then we haven't
    tutorialFlags: {
    },

    gameOver: false,

    // memoized "system"-level properties:
    AGENT: [], // entities that decide their own actions
    ACTOR: {}, // entities with actions queued right now
    NOT_ANIMATED: {}, // entities that don't animate every tick
    PHEROMONE_EMITTER: {}, // entities that emit a pheromone
    BALLISTIC: {}, // entities that follow a ballistic trajectory
    EXPLOSIVE: {}, // entities that explode when they die
    TOWER: {}, // entities that track a target to aim at
    FLAMMABLE: {}, // entities that can catch on fire and burn
    GENERATOR: {}, // entities that produce power
    CONSUMER: {}, // entities that consume power
    MELTABLE: {}, // entities that can melt into a pheromone fluid
  };

  // lookup for entityIDs by entityType
  for (const entityType in Entities) {
    game[entityType] = [];
  }

  // init players
  const gaia = initPlayer('COMPUTER', 0, 'Gaia');
  game.players[0] = gaia.player;
  game.bases[0] = gaia.base;

  const player = initPlayer('HUMAN', 1, 'You');
  game.players[1] = player.player;
  game.bases[1] = player.base;

  for (let i = 2; i < numPlayers; i++) {
    const {player, base} = initPlayer('COMPUTER', i, 'Enemy');
    game.players[player.id] = player;
    game.bases[player.id] = base;
  }

  return game;
};

module.exports = {initBaseState, initPlayer};
