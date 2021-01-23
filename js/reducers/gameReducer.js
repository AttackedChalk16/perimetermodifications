// @flow

const {
  addEntity, removeEntity, markEntityAsStale,
  changeEntitySize, changeEntityType,
} = require('../simulation/entityOperations');
const {
  entityInsideGrid, lookupInGrid, getEntityPositions,
} = require('../utils/gridHelpers');
const {
  queueAction, makeAction, isActionTypeQueued,
} = require('../simulation/actionQueue');
const {add, subtract, round, floor, ceil, equals} = require('../utils/vectors');
const {render} = require('../render/render');
const {fillPheromone, clearPheromone, setPheromone} = require('../simulation/pheromones');
const {clamp, encodePosition, decodePosition} = require('../utils/helpers');
const {getEntityPheromoneSources} = require('../selectors/pheromones');
const {Entities} = require('../entities/registry');
const globalConfig = require('../config');

import type {Game, Action} from '../types';

const gameReducer = (game: Game, action: Action): Game => {
  switch (action.type) {
    case 'ENQUEUE_ENTITY_ACTION': {
      const {entityAction, entity} = action;
      queueAction(game, entity, entityAction);
      return game;
    }
    case 'SET_VIEW_POS': {
      const {viewPos, viewWidth, viewHeight} = action;
      game.viewPos = viewPos;
      if (viewWidth != null) {
        game.viewWidth = viewWidth;
      }
      if (viewHeight != null) {
        game.viewHeight = viewHeight;
      }
      if (action.rerender) {
        render(game);
      }
      return game;
    }
    case 'INCREMENT_ZOOM': {
      const {zoom} = action;
      const ratio = game.viewWidth / game.viewHeight;
      const widthInc = Math.round(zoom * ratio * 10);
      const heightInc = Math.round(zoom * ratio * 10);

      const nextWidth = game.viewWidth + widthInc;
      const nextHeight = game.viewHeight + heightInc;
      const oldWidth = game.viewWidth;
      const oldHeight = game.viewHeight;
      game.viewWidth = clamp(nextWidth, Math.round(5 * ratio), game.gridWidth + 50);
      game.viewHeight = clamp(nextHeight, Math.round(5 * ratio), game.viewHeight + 50);
      game.viewPos = floor({
        x: (oldWidth - game.viewWidth) / 2 + game.viewPos.x,
        y: (oldHeight - game.viewHeight) / 2 + game.viewPos.y,
      });
      render(game); // HACK: for level editor
      return game;
    }
    case 'SET_PHEROMONE_VISIBILITY': {
      const {pheromoneType, isVisible} = action;
      game.pheromoneDisplay[pheromoneType] = isVisible;
      return game;
    }
    case 'CREATE_ENTITY': {
      const {entity} = action;
      return addEntity(game, entity);
    }
    case 'DELETE_ENTITY': {
      const {entity} = action;
      removeEntity(game, entity);
      return game;
    }
    case 'CREATE_ENTITIES': {
      return createEntitiesReducer(game, action);
    }
    case 'SET_ON_FIRE': {
      const {entityID} = action;
      game.entities[entityID].onFire = true;
      return game;
    }
    case 'UPDATE_TURBINE': {
      const {entityID, thetaSpeed} = action;
      const turbine = game.entities[entityID];
      turbine.thetaSpeed = clamp(
        thetaSpeed,
        -1 * Entities[turbine.type].config.maxThetaSpeed,
        Entities[turbine.type].config.maxThetaSpeed,
      );
      return game;
    }
    case 'SET_FOCUSED': {
      const {entityID} = action;
      game.focusedEntity = game.entities[entityID];
      return game;
    }
    case 'SET_CONTROLLED': {
      const {entityID} = action;
      game.controlledEntity = game.entities[entityID];
      return game;
    }
    case 'COPY_ENTITIES': {
      const {rect} = action;
      game.clipboard = rect;
      return game;
    }
    case 'PASTE_ENTITIES': {
      const {pastePos} = action;
      const {position, width, height} = game.clipboard;
      game.viewImage.isStale = true;

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const entities = lookupInGrid(game.grid, add(position, {x, y}))
            .map(id => game.entities[id])
            .filter(e => equals(e.position, add(position, {x, y})));
          for (const copyEntity of entities) {
            const pos = add(pastePos, {x, y});
            const key = encodePosition(pos);
            game.viewImage.stalePositions[key] = pos;

            const entity = {...copyEntity, position: pos};
            if (!entityInsideGrid(game, entity)) continue;
            addEntity(game, entity);
          }
        }
      }

      return game;
    }
    case 'FILL_PHEROMONE': {
      const {gridPos, pheromoneType, playerID, quantity} = action;
      fillPheromone(game, gridPos, pheromoneType, playerID, quantity);
      return game;
    }
    case 'UPDATE_ALL_PHEROMONES': {
      const {pheromones} = action;
      // console.log('received pheromone update', pheromones, game.time);
      for (const positionHash of pheromones) {
        for (const encodedPosition in positionHash) {
          const position = decodePosition(encodedPosition);
          const {pheromoneType, quantity, playerID} = positionHash[encodedPosition];
          setPheromone(game, position, pheromoneType, quantity, playerID, true /*no worker*/);
        }
      }
      return game;
    }
    case 'SHOW_DEBUG': {
      const {shouldShow, showType} = action;
      game[showType] = shouldShow;
      return game;
    }
    case 'DELETE_ENTITIES': {
      const {rect} = action;
      const {position, width, height} = rect;
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const pos = add(position, {x, y});
          const ids = lookupInGrid(game.grid,  pos);
          for (const id of ids) {
            const entity = game.entities[id];
            removeEntity(game, entity);
            if (entity.notAnimated) {
              game.viewImage.allStale = true;
            }
          }
        }
      }
      return game;
    }
    case 'SET_SPRITE_SHEET': {
      const {name, img} = action;
      game.sprites[name] = img;
      game.viewImage.isStale = true;
      game.viewImage.allStale = true;
      return game;
    }
    case 'SET_TUTORIAL_FLAG': {
      const {flag} = action;
      game.tutorialFlags[flag] = game.time;
      return game;
    }
    case 'SET_IS_RAINING': {
      const {rainTicks} = action;
      game.rainTicks = rainTicks;
      return game;
    }

    case 'MARK_FOR_DRILLING': {
      const {playerID, entityIDs} = action;

      return game;
    }
    case 'MARK_FOR_PICKUP': {
      return game;
    }
    case 'MARK_FOR_PUTDOWN': {
      return game;
    }
    case 'MARK_BLUEPRINT': {
      return game;
    }

    case 'MARK_DIRT': {
      const {playerID, dirtIDs} = action;
      let taskNeed = 0;
      const pherSources = [];
      for (const id of dirtIDs) {
        const dirt = game.entities[id];
        if (dirt.marked == null && dirt.position != null) {
          taskNeed++;
          game.markedDirtIDs.push(id);
        }
        dirt.marked = playerID;
        fillPheromone(game, dirt.position, 'MARKED_DIRT_PHER', playerID);
        markEntityAsStale(game, dirt);
      }
      game.bases[playerID].taskNeed['GO_TO_DIRT'] += taskNeed;
      return game;
    }
    case 'MARK_DIRT_PUTDOWN': {
      const {playerID, emptyPositions} = action;
      for (const pos of emptyPositions) {
        let alreadyAdded = false;
        for (const p of game.dirtPutdownPositions) {
          if (equals(p, pos)) {
            alreadyAdded = true;
            break;
          }
        }
        if (alreadyAdded) {
          continue;
        } else {
          game.dirtPutdownPositions.push(pos);
          game.floodFillSources.push({
            playerID,
            pheromoneType: 'DIRT_DROP',
            position: pos,
            quantity: globalConfig.pheromones.DIRT_DROP.quantity,
          });
        }
      }
      return game;
    }
    case 'COLLECT_ENTITIES': {
      const {entities} = action;
      for (const entity of entities) {
        entity.collectedAs = entity.type;
        changeEntityType(game, entity, entity.type, 'AGENT');
        delete entity.notAnimated;
        delete game.NOT_ANIMATED[entity.id];
        entity.isAgent = true;
        entity.blockingTypes = [...Entities.AGENT.config.blockingTypes];
        entity.actions = [];
        entity.playerID = game.playerID;
        entity.MOVE = {
          duration: 4,
          spriteOrder: [1],
        };
        entity.MOVE_TURN = {
          duration: 2,
          spriteOrder: [1],
        };
        entity.TURN =  {
          duration: 1,
          spriteOrder: [1],
        };
        entity.task = 'RETURN';
        entity.RETURN = {
          base: 0,
          forwardMovementBonus: 0,
          prevPositionPenalty: -100,
          COLONY: 1000,
        }
      }
      return game;
    }
    case 'SET_PLACE_TYPE': {
      const {placeType} = action;
      game.placeType = placeType;
      return game;
    }
    case 'SWAP_MINI_MAP': {
      game.maxMinimap = !game.maxMinimap;
      game.viewImage.allStale = true;
      return game;
    }
    case 'SET_MOUSE_MODE': {
      const {mouseMode} = action;
      game.mouseMode = mouseMode;
      return game;
    }
    case 'SET_KEEP_MARQUEE': {
      const {keepMarquee} = action;
      game.keepMarquee = keepMarquee;
      return game;
    }
    case 'SET_GAME_OVER': {
      /**
       * false | 'win' | 'lose'
       */
      const {gameOver} = action;
      game.gameOver = gameOver;
      return game;
    }
  }
  return game;
};

function createEntitiesReducer(game: Game, action): Game {
  const {entityType, args, rect} = action;
  const {position, width, height} = rect;
  const {make, config} = Entities[entityType];

  if (config.onlyMakeOne) {
    const occupied = lookupInGrid(game.grid,  position)
      .map(id => game.entities[id])
      .filter(e => !e.notOccupying)
      .length > 0;
    const entity = make(game, position, ...args);
    if (!occupied && entityInsideGrid) {
      addEntity(game, entity);
    }
  } else {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const pos = add(position, {x, y});
        const occupied = lookupInGrid(game.grid,  pos)
          .map(id => game.entities[id])
          .filter(e => !e.notOccupying)
          .length > 0;
        if (occupied) continue;
        const entity = make(game, pos, ...args);
        if (!entityInsideGrid(game, entity)) continue;
        addEntity(game, entity);
      }
    }
  }
  if (Entities[entityType].config.notAnimated) {
    game.viewImage.allStale = true;
  }
  return game;
}

module.exports = {gameReducer};
