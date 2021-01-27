// @flow

const {add, equals} = require('../utils/vectors');
const {lookupInGrid} = require('../utils/gridHelpers');
const {Entities} = require('../entities/registry');
const {getPheromoneAtPosition} = require('../selectors/pheromones');
const {getNeighborPositions} = require('../selectors/neighbors');
const {isDiagonalMove} = require('../utils/helpers');
const {
  canAffordBuilding, getModifiedCost,
} = require('../selectors/buildings');



const canCollect = (game, gridPos): boolean => {
  // don't interact with the same position twice
  if (game.prevInteractPosition != null && equals(game.prevInteractPosition, gridPos)) {
    return false;
  }

  // only can collect entities that are connected to the colony
  if (!isNeighboringColonyPher(game, gridPos)) {
    return false;
  }

  const entities = lookupInGrid(game.grid, gridPos)
    .map(id => game.entities[id])
    .filter(e => e.isCollectable && e.type != 'AGENT'); // && e.task == null)

  return entities.length > 0;
};
