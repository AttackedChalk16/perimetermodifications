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
  STONE: require('./stone.js'),
  DOODAD: require('./doodad.js'),
  DIRT: require('./dirt.js'),
  FOOD: require('./food.js'),

  AGENT: require('./agent.js'),
  WORM: require('./worm.js'),

  TOKEN: require('./token.js'),

  DYNAMITE: require('./dynamite.js'),
};

module.exports = {
  Entities,
};

