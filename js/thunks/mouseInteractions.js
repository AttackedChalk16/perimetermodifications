// @flow

const {lookupInGrid} = require('../utils/gridHelpers');
const {Entities} = require('../entities/registry');
const {getPheromoneAtPosition} = require('../selectors/pheromones');
const {getNeighborPositions} = require('../selectors/neighbors');
const {isDiagonalMove} = require('../utils/helpers');
const {canAffordBuilding} = require('../selectors/misc');

const handleCollect = (state, dispatch, gridPos) => {
  // if (!state.game.mouse.isLeftDown) return;

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
  // if (!state.game.mouse.isRightDown) return;

  const game = state.game;

  // only can place entities that are connected to the colony
  if (!isNeighboringColonyPher(game, gridPos)) {
    return;
  }

  let entityType = game.placeType;
  if (game.placeType == 'HOT COAL') {
    entityType = 'COAL';
  }
  // can't place if there's no entity type selected
  if (entityType == null) return;

  const config = Entities[entityType].config;

  const base = game.bases[game.playerID];

  // can't place a resource you don't have
  if (config.isCollectable && base.resources[entityType] <= 0) return;

  // can't place buildings you can't afford
  if (config.cost && !canAffordBuilding(base, config.cost)) {
    return;
  }

  // can't place on top of other resources
  const occupied = lookupInGrid(game.grid, gridPos)
    .map(id => game.entities[id])
    .filter(e => !e.notOccupying)
    .length > 0;
  if (occupied) return;

  // make the entity and update base resources for its cost
  let entity = null;
  if (config.isCollectable) {
    dispatch({type: 'SUBTRACT_BASE_RESOURCES', subtractResources: {[entityType]: 1}});
    entity = Entities[entityType].make(game, gridPos);
  } else if (config.cost) {
    dispatch({type: 'SUBTRACT_BASE_RESOURCES', subtractResources: {...config.cost}});
    entity = Entities[entityType].make(game, gridPos, game.playerID);
  }

  if (entity != null) {
    if (game.placeType == 'HOT COAL') {
      entity.onFire = true;
    }
    dispatch({type: 'CREATE_ENTITY', entity});
  }
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
