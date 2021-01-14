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
      COLONY: true,
      ALERT: false,
      DIRT_DROP: false,
      MARKED_DIRT_PHER: false,
      WATER: true,
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

    staleTiles: [],
    floodFillSources: [],
    reverseFloodFillSources: [],
    dispersingPheromonePositions: [],
    pheromoneWorker: new Worker('bin/pheromoneWorker.js'),

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
    const {player, colony} = initPlayer('COMPUTER', i, 'Enemy');
    game.players[player.id] = player;
    game.bases[player.id] = colony;
  }

  return game;
};

module.exports = {initBaseState, initPlayer};
