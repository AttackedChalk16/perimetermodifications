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
  gravity: -100,
};

const nonMoltenPheromoneBlockingTypes = [
  'DIRT',  'STONE', 'DOODAD', 'TURRET',
];
const pheromoneBlockingTypes = [
  ...nonMoltenPheromoneBlockingTypes,
  'STEEL', 'IRON',
];

const pheromones = {
  COLONY: {
    quantity: 350,
    decayAmount: 1,
    color: 'rgb(0, 0, 255)',
    tileIndex: 0,

    blockingTypes: [...pheromoneBlockingTypes, 'COAL'],
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
    quantity: 120,
    decayAmount: 120,
    decayRate: 0.0005,
    color: 'rgb(0, 0, 255)',
    tileIndex: 1,

    blockingTypes: [...pheromoneBlockingTypes, 'WORM'],
    isDispersing: true,
    heatPoint: 100,
    heatsTo: 'STEAM',
    heatRate: 0.02,
    viscosity: {
      verticalLeftOver: 0,
      diagonalLeftOver: 0.5,
      horizontalLeftOver: 0.8,
    },
    isFluid: true,
  },
  STEAM: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 0.0005,
    color: 'rgb(255, 255, 255)',
    tileIndex: 4,

    blockingTypes: [...pheromoneBlockingTypes],
    isDispersing: true,
    coolPoint: 5, // heat level to condense at
    coolsTo: 'WATER',
    coolRate: 0.1, // amount of yourself that condenses per step
    coolConcentration: 80, // amount of yourself needed before condensation starts
    isFluid: true,
    viscosity: {
      verticalLeftOver: 0,
      diagonalLeftOver: 0.3,
      horizontalLeftOver: 0.66,
    },
    isRising: true,
  },
  MOLTEN_IRON: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 0.0005,
    color: 'rgb(100, 100, 100)',
    tileIndex: 5,

    blockingTypes: [...pheromoneBlockingTypes],
    isDispersing: true,
    coolPoint: 80, // heat level to freeze at
    coolsTo: 'IRON',
    coolRate: 1,
    coolsToEntity: true,
    isFluid: true,
    viscosity: {
      verticalLeftOver: 0,
      diagonalLeftOver: 0,
      horizontalLeftOver: 1,
    },
    // NOTE: not using this
    combinesTo: [{
      substance: 'PHEROMONE',
      type: 'MOLTEN_STEEL',
      ingredients: [
        {substance: 'ENTITY', type: 'COAL'},
      ],
    }],
  },
  MOLTEN_STEEL: {
    quantity: 240,
    decayAmount: 240,
    decayRate: 0.0005,
    color: 'rgb(100, 100, 100)',
    tileIndex: 4,

    blockingTypes: [...pheromoneBlockingTypes],
    isDispersing: true,
    coolPoint: 90, // heat level to freeze at
    coolsTo: 'STEEL',
    coolRate: 1,
    coolsToEntity: true,
    isFluid: true,
    viscosity: {
      verticalLeftOver: 0,
      diagonalLeftOver: 0,
      horizontalLeftOver: 1,
    },
  },
  HEAT: {
    quantity: 120,
    decayAmount: 12,
    decayRate: 1, // how much it decays per tick
    color: 'rgb(255, 0, 0)',
    tileIndex: 2,

    blockingTypes: [...nonMoltenPheromoneBlockingTypes],
  },
};

module.exports = {config, pheromones};
