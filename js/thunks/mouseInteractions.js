// @flow

const {lookupInGrid} = require('../utils/gridHelpers');
const {Entities} = require('../entities/registry');
const {getPheromoneAtPosition} = require('../selectors/pheromones');
const {getNeighborPositions} = require('../selectors/neighbors');
const {isDiagonalMove} = require('../utils/helpers');

const handleCollect = (state, dispatch, gridPos) => {
  if (!state.game.mouse.isLeftDown) return;

  const game = state.game;

  // only can collect entities that are connected to the colony
  if (!isNeighboringColonyPher(game, gridPos)) {
    return;
  }

  const entities = lookupInGrid(game.grid, gridPos)
    .map(id => game.entities[id])
    .filter(e => e.isCollectable && e.task == null)
  // NOTE: for some reason using this as the check causes pheromones
  // to not spread???
  //&& e.type != 'AGENT');

  dispatch({type: 'COLLECT_ENTITIES', entities});
}

const handlePlace = (state, dispatch, gridPos) => {
  if (!state.game.mouse.isRightDown) return;

  const game = state.game;

  // only can place entities that are connected to the colony
  if (!isNeighboringColonyPher(game, gridPos)) {
    return;
  }

  const entityType = game.placeType;
  // can't place if there's no entity type selected
  if (entityType == null) return;

  const base = game.bases[game.playerID];

  // can't place a resource you don't have
  if (base.resources[entityType] <= 0) return;

  // can't place on top of other resources
  const occupied = lookupInGrid(game.grid, gridPos)
    .map(id => game.entities[id])
    .filter(e => !e.notOccupying)
    .length > 0;
  if (occupied) return;

  const entity = Entities[entityType].make(game, gridPos);
  dispatch({type: 'CREATE_ENTITY', entity});
  base.resources[entityType] -= 1;
}


const isNeighboringColonyPher = (game, position) => {
  const neighbors = getNeighborPositions(game, {position});
  for (const neighbor of neighbors) {
    if (isDiagonalMove(neighbor, position)) continue;

    const pher = getPheromoneAtPosition(game, neighbor, 'COLONY', game.playerID);
    if (pher > 0) {
      return true;
    }
  }
  return false;
}

module.exports = {handleCollect, handlePlace};
