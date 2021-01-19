// @flow

const globalConfig = require('../config');

/**
 * Entity creation checklist:
 *  - add the entity here keyed by type (in render order)
 *  - add the entities/entityType file to this directory
 *  - add the entities options and arguments to ui/LevelEditor
 *  - if the entity has any special properties, add them to the gameState
 *    initialization and add an updating function for them in the tickReducer
 *  - if it blocks pheromones, add to the config
 */


const Entities = {
  BACKGROUND: require('./background.js'),
  DOODAD: require('./doodad.js'),

  STONE: require('./stone.js'),
  DIRT: require('./dirt.js'),
  IRON: require('./iron.js'),
  STEEL: require('./steel.js'),

  COAL: require('./coal.js'),
  FOOD: require('./food.js'),
  AGENT: require('./agent.js'),
  WORM: require('./worm.js'),
  TOKEN: require('./token.js'),
  TURBINE: require('./turbine.js'),
  TURRET: require('./turret.js'),

  DYNAMITE: require('./dynamite.js'),
  MISSILE: require('./missile.js'),
  BULLET: require('./bullet.js'),
};

module.exports = {
  Entities,
};

