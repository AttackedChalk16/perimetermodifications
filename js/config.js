// @flow

const config = {
  msPerTick: 16,

  canvasWidth: 1200,
  canvasHeight: 1200,

  viewWidth: 18,
  viewHeight: 32,
  useFullScreen: true,
  cellWidth: 33,
  cellHeight: 25,

  audioFiles: [
    {path: 'audio/Song Oct. 9.wav', type: 'wav'},
  ],

  dispersingPheromoneUpdateRate: 6,
  gravity: -4,
};

const pheromoneBlockingTypes = [
  'DIRT', 'FOOD', 'STONE', 'DOODAD',
];

const pheromones = {
  COLONY: {
    quantity: 350,
    decayAmount: 1,
    color: 'rgb(0, 0, 255)',
    tileIndex: 1,

    blockingTypes: pheromoneBlockingTypes,
  },
  DIRT_DROP: {
    quantity: 300,
    decayAmount: 1,
    color: 'rgb(210, 105, 30)',
    tileIndex: 5,

    blockingTypes: pheromoneBlockingTypes,
  },
  ALERT: {
    quantity: 60,
    decayAmount: 10,
    decayRate: 1, // how much it decays per tick
    color: 'rgb(255, 0, 0)',
    tileIndex: 2,

    blockingTypes: pheromoneBlockingTypes,
    isDispersing: true,
  },
  MARKED_DIRT_PHER: {
    quantity: 45,
    decayAmount: 1,
    color: 'rgb(210, 105, 30)',
    tileIndex: 5,

    blockingTypes: pheromoneBlockingTypes,
    canInhabitBlocker: true,
  },
  WATER: {
    quantity: 12,
    decayAmount: 12,
    decayRate: 0.0005,
    color: 'rgb(0, 0, 255)',
    tileIndex: 1,

    blockingTypes: [...pheromoneBlockingTypes, 'WORM'],
    isDispersing: true,
    isFluid: true,
  },
};

module.exports = {config, pheromones};
