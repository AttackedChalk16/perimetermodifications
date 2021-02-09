// @flow

const {
  fadeAllPheromones, computeAllPheromoneSteadyState,
  setPheromone, fillPheromone, clearPheromone,
  refreshPheromones,
} = require('../simulation/pheromones');
const {
  lookupInGrid, getEntityPositions,
  entityInsideGrid,
} = require('../utils/gridHelpers');
const {
  makeAction, isActionTypeQueued, getDuration,
  queueAction, stackAction, cancelAction,
} = require('../simulation/actionQueue.js');
const {
  removeEntity, addEntity, changeEntityType, moveEntity,
  addSegmentToEntity, changePheromoneEmitterQuantity,
} = require('../simulation/entityOperations');
const {render} = require('../render/render');
const {
  getPosBehind, getPositionsInFront, onScreen,
} = require('../selectors/misc');
const {oneOf} = require('../utils/stochastic');
const {collides, collidesWith} = require('../selectors/collisions');
const {
  add, equals, subtract, magnitude, scale,
  makeVector, vectorTheta, floor, round,
  abs, dist,
} = require('../utils/vectors');
const {
  clamp, closeTo, encodePosition, decodePosition,
} = require('../utils/helpers');
const {getInterpolatedIndex, getDictIndexStr} = require('../selectors/sprites');
const {
  entityStartCurrentAction,
} = require('../simulation/actionOperations');
const {agentDecideAction} = require('../simulation/agentOperations');
const {getFreeNeighborPositions, areNeighbors} = require('../selectors/neighbors');
const {
  getPheromoneAtPosition, getTemperature,
} = require('../selectors/pheromones');
const globalConfig = require('../config');
const {dealDamageToEntity} = require('../simulation/miscOperations');
const {Entities} = require('../entities/registry');
const {canAffordBuilding} = require('../selectors/buildings');

import type {
  Game, Entity, Action, Ant,
} from '../types';

let totalTime = 0;
const tickReducer = (game: Game, action: Action): GameState => {
  switch (action.type) {
    case 'START_TICK': {
      if (game != null && game.tickInterval != null) {
        return game;
      }

      game.prevTickTime = new Date().getTime();

      return {
        ...game,
        tickInterval: setInterval(
          // HACK: store is only available via window
          () => store.dispatch({type: 'TICK'}),
          globalConfig.config.msPerTick,
        ),
      };
    }
    case 'STOP_TICK': {
      clearInterval(game.tickInterval);
      game.tickInterval = null;

      return game;
    }
    case 'TICK': {
      return doTick(game);
    }
  }
  return game;
};

//////////////////////////////////////////////////////////////////////////
// Do Tick
//////////////////////////////////////////////////////////////////////////
const doTick = (game: Game): Game => {
  const curTickTime = new Date().getTime();

	game.time += 1;

  // initializations:
  if (game.time == 1) {
    game.prevTickTime = new Date().getTime();
    game.viewImage.allStale = true;
    computeAllPheromoneSteadyState(game);
    game.pheromoneWorker.postMessage({
      type: 'INIT',
      grid: game.grid,
      entities: game.entities,
      PHEROMONE_EMITTER: game.PHEROMONE_EMITTER || {},
      TURBINE: game.TURBINE || [],
    });
    const base = game.entities[game.BASE[0]];
    if (base) {
      game.focusedEntity = base;
    }
  }
  if (game.time > 45) {
    game.focusedEntity = null;
  }

  // game/frame timing
  game.timeSinceLastTick = curTickTime - game.prevTickTime;

  // these are the ECS "systems"
  keepControlledMoving(game);
  updateActors(game);
  updateAgents(game);
  updateTiledSprites(game);
  updateViewPos(game, false /*don't clamp to world*/);
  updateRain(game);
  updateTicker(game);
  updatePheromoneEmitters(game);
  updateTowers(game);
  updateBases(game);
  updateBallistics(game);
  updateFlammables(game);
  updateCoal(game);
  updateMeltables(game);
  updateExplosives(game);
  updateGenerators(game);

  updatePheromones(game);
  render(game);

  // update timing frames
  game.totalGameTime += curTickTime - game.prevTickTime;
  game.prevTickTime = curTickTime;

  return game;
};

//////////////////////////////////////////////////////////////////////////
// Updating Agents
//////////////////////////////////////////////////////////////////////////

const updateActors = (game): void => {
  let fn = () => {}

  // see comment below
  const notNextActors = {};

  for (const id in game.ACTOR) {
    const actor = game.entities[id];
    if (
      actor == null ||
      actor.actions == null ||
      actor.actions.length == 0
    ) {
      continue;
    }

    if (actor.isAgent) {
      fn = agentDecideAction;
    }
    stepAction(game, actor, fn);

    if (actor.actions.length == 0) {
      notNextActors[id] = true;
    }
  }

  // the reason for deleting them like this instead of just
  // tracking which ones should make it to the next tick, is that
  // new entities can be added to the ACTOR queue inside of stepAction
  // (e.g. an explosive killing another explosive) and they need
  // to make it to the next time this function is called
  for (const id in notNextActors) {
    delete game.ACTOR[id];
  }
}

const updateAgents = (game): void => {
	for (const id of game.AGENT) {
    const agent = game.entities[id];
    if (agent == null) {
      console.log("no agent with id", id);
      continue;
    }
    agent.age += game.timeSinceLastTick;
    agent.timeOnTask += game.timeSinceLastTick;
    agent.prevHPAge += game.timeSinceLastTick;

    if (agent.actions.length == 0) {
      agentDecideAction(game, agent);
    }
	}
}

//////////////////////////////////////////////////////////////////////////
// Explosives, ballistics
//////////////////////////////////////////////////////////////////////////

const updateExplosives = (game): void => {
  for (const id in game.EXPLOSIVE) {
    const explosive = game.entities[id];
    explosive.age += game.timeSinceLastTick;
    if (
      ((explosive.timer != null && explosive.age > explosive.timer)
        || explosive.timer == null)
      && explosive.position != null
      && !isActionTypeQueued(explosive, 'DIE')
    ) {
      queueAction(game, explosive, makeAction(game, explosive, 'DIE'));
    }
  }
};

const updateBallistics = (game): void => {
  for (const id in game.BALLISTIC) {
    const ballistic = game.entities[id];
    if (ballistic == null || ballistic.position == null) continue;
    ballistic.age += game.timeSinceLastTick;
    // if it has collided with something, deal damage to it and die
    // OR if it is within Radius of target, die
    const collisions =
      collidesWith(game, ballistic, ballistic.blockingTypes)
      .filter(e => e.playerID != ballistic.playerID);
    let inRadius = false;
    if (ballistic.targetID != null && ballistic.warhead != null) {
      const target = game.entities[ballistic.targetID];
      if (target != null) {
        if (Math.abs(dist(ballistic.position, target.position)) <= 4) {
          inRadius = true;
        }
      }
    }

    if (collisions.length > 0 || inRadius) {
      if (ballistic.missRate == null ||
        (ballistic.missRate != null && Math.random() > ballistic.missRate)
      ) {
        const alreadyDamaged = {};
        collisions.forEach(e => {
          if (alreadyDamaged[e.id]) return;
          alreadyDamaged[e.id] = true;
          dealDamageToEntity(game, e, ballistic.damage);
        });
        queueAction(game, ballistic, makeAction(game, ballistic, 'DIE'));
        continue;
      }
    }

    // otherwise continue along its trajectory
    let {age, initialTheta, velocity, width, height} = ballistic;
    const prevPosition = add(
      ballistic.ballisticPosition,
      {x: width / 2, y: height / 2},
    );
    if (ballistic.prevPositions) {
      ballistic.prevPositions.push(prevPosition);
    }

    const {x, y} = ballistic.initialPosition;
    age /= 10000;
    ballistic.ballisticPosition = {
      x: x + velocity * age * Math.cos(initialTheta),
      y: y + velocity * age * Math.sin(initialTheta)
        - 0.5 * globalConfig.config.gravity * age * age,
    };
    ballistic.ballisticTheta = vectorTheta(subtract(
      add(
        ballistic.ballisticPosition,
        {x: width / 2, y: height / 2},
      ),
      prevPosition,
    ));

    moveEntity(game, ballistic, round(ballistic.ballisticPosition));
    if (!entityInsideGrid(game, ballistic)) {
      queueAction(game, ballistic, makeAction(game, ballistic, 'DIE'));
    }
  }
};

//////////////////////////////////////////////////////////////////////////
// Fire, meltables
//////////////////////////////////////////////////////////////////////////

const updateFlammables = (game): void => {
  for (const id in game.FLAMMABLE) {
    const flammable = game.entities[id];
    // if on fire, burn
    if (flammable.onFire) {
      flammable.isCollectable = false;
      // check if you just caught on fire, and set quantity
      if (flammable.quantity == 0) {
        changePheromoneEmitterQuantity(game, flammable, flammable.heatQuantity);
      }
      flammable.fuel -= game.timeSinceLastTick;
      if (flammable.fuel <= 0) {
        queueAction(game, flammable, makeAction(game, flammable, 'DIE'));
      }
    // if not on fire, check if it should catch on fire
    } else {
      const temp = getTemperature(game, flammable.position);
      if (temp >= flammable.combustionTemp) {
        if (flammable.type != 'AGENT') {
          flammable.onFire = true;
          flammable.isCollectable = false;
        }
      }
    }
  }
}

const updateCoal = (game): void => {
  for (const id of game.COAL) {
    const coal = game.entities[id];

    // coal + iron = steel
    const moltenIron = getPheromoneAtPosition(game, coal.position, 'MOLTEN_IRON', 0);
    if (moltenIron > 0) {
      const position = {...coal.position};
      removeEntity(game, coal);
      fillPheromone(game, position, 'MOLTEN_STEEL', game.gaiaID, moltenIron * 2);
      setPheromone(game, position, 'MOLTEN_IRON', 0, game.gaiaID);
    }

    // coal + molten sand = silicon
    const moltenSand = getPheromoneAtPosition(game, coal.position, 'MOLTEN_SAND', 0);
    if (moltenSand > 0) {
      const position = {...coal.position};
      removeEntity(game, coal);
      setPheromone(game, position, 'MOLTEN_SAND', 0, game.gaiaID);
      addEntity(game, Entities.SILICON.make(game, coal.position));
    }
  }
};

const updateMeltables = (game): void => {
  for (const id in game.MELTABLE) {
    const meltable = game.entities[id];

    const temp = getTemperature(game, meltable.position);
    if (temp >= meltable.meltTemp) {
      // if you're an agent (or food!) then you're en route to being collected
      let config = Entities[meltable.type].config;
      if (!config.isMeltable) {
        meltable.type = meltable.collectedAs;
        meltable.playerID = 0;
        config = Entities[meltable.type].config;
      }

      // if it produces a different pheromone than what it melts to, e.g. ICE,
      // then need to remove that, then melt
      if (meltable.meltType) {
        changePheromoneEmitterQuantity(game, meltable, 0);
        meltable.pheromoneType = meltable.meltType;
        game.pheromoneWorker.postMessage({
          type: 'CHANGE_EMITTER_TYPE',
          entityID: meltable.id,
          pheromoneType: meltable.pheromoneType,
        });
      }
      changePheromoneEmitterQuantity(
        game, meltable, meltable.heatQuantity * (meltable.hp / config.hp),
      );
      changeEntityType(game, meltable, meltable.type, 'FOOD');
      queueAction(game, meltable, makeAction(game, meltable, 'DIE'));
    }
  }
};

//////////////////////////////////////////////////////////////////////////
// Towers
//////////////////////////////////////////////////////////////////////////

const updateTowers = (game): void => {
  for (const id in game.TOWER) {
    const tower = game.entities[id];
    const config = Entities[tower.type].config;
    // don't do anything if unpowered
    if (
      tower.isPowerConsumer &&
      !tower.isPowered &&
      !game.pausePowerConsumption
    ) continue;

    // choose target if possible
    if (tower.targetID == null) {
      const possibleTargets = [];
      for (const missileID of game.MISSILE) {
        const missile = game.entities[missileID];
        if (missile.playerID != tower.playerID) {
          possibleTargets.push(missileID);
        }
      }
      tower.targetID = oneOf(possibleTargets);
    }

    // aim at target
    let targetTheta = config.minTheta;
    if (tower.targetID != null) {
      const target = game.entities[tower.targetID];
      // clear dead target
      if (target == null) {
        tower.targetID = null;

      // else aim at living target
      } else {
        const targetPos = game.entities[tower.targetID].position;
        targetTheta = vectorTheta(subtract(targetPos, tower.position)) % (Math.PI / 2);
        targetTheta = clamp(targetTheta, config.minTheta, config.maxTheta);
        if (targetPos.y >= tower.position.y) {
          targetTheta = config.minTheta;
        }
      }
    }

    // treat missile turrets as a special case
    if (tower.type == 'MISSILE_TURRET') {
      tower.thetaAccel = 0;
      tower.theta = clamp(targetTheta, config.minTheta, config.maxTheta);
    } else if (closeTo(tower.theta, targetTheta)) {
      tower.thetaAccel /= -2;
    } else if (tower.theta < targetTheta) {
      tower.thetaAccel = config.thetaAccel;
    } else if (tower.theta > targetTheta) {
      tower.thetaAccel = -1 * config.thetaAccel;
    }
    tower.thetaSpeed += tower.thetaAccel;
    tower.thetaSpeed = clamp(tower.thetaSpeed, -config.maxThetaSpeed, config.maxThetaSpeed);
    tower.theta += tower.thetaSpeed;
    const clamped = clamp(tower.theta, config.minTheta, config.maxTheta);
    if (!closeTo(clamped, tower.theta)) {
      tower.thetaSpeed = 0;
      tower.thetaAccel = 0;
    }
    tower.theta = clamped;

    // shoot at target
    if (tower.targetID != null && !isActionTypeQueued(tower, 'SHOOT')) {
      if (tower.needsCooldown) {
        tower.shotsSinceCooldown += 1;
        if (tower.shotsSinceCooldown > tower.shotsTillCooldown) {
          tower.shotsSinceCooldown = 0;
          queueAction(
            game, tower,
            makeAction(game, tower, 'COOLDOWN', null),
          );
        }
      }

      let canAfford = true;
      if (tower.launchCost) {
        canAfford = canAffordBuilding(game.bases[game.playerID], tower.launchCost);
        if (canAfford) {
          for (const resource in tower.launchCost) {
            game.bases[game.playerID].resources[resource] -= tower.launchCost[resource];
          }
        }
      }

      if (canAfford) {
        queueAction(
          game, tower,
          makeAction(
            game, tower, 'SHOOT',
            {theta: tower.theta, projectileType: tower.projectileType}
          ),
        );
      }
    }

  }
};

//////////////////////////////////////////////////////////////////////////
// Generators, Bases
//////////////////////////////////////////////////////////////////////////

const updateGenerators = (game: Game): void => {
  const maxLight = globalConfig.pheromones.LIGHT.quantity;
  // tally up available power
  let totalPowerGenerated = 0;
  for (const id in game.GENERATOR) {
    const generator = game.entities[id];

    let powerGenerated = Entities[generator.type].config.powerGenerated;
    const maxPower = powerGenerated;

    // Handle turbines
    if (generator.type == 'TURBINE') {
      generator.theta = (generator.theta + generator.thetaSpeed) % (2 * Math.PI);
      if (generator.thetaSpeed < 0.001) {
        generator.thetaSpeed = 0;
      }
      powerGenerated *= Math.ceil(generator.thetaSpeed / generator.maxThetaSpeed);
      // generator.powerGenerated = Math.min(powerGenerated * maxPower / 2, maxPower);
    }

    // Handle solar panels
    if (generator.type == 'SOLAR_PANEL') {
      const sunLight = getPheromoneAtPosition(game, generator.position, 'LIGHT', 0);
      powerGenerated *= sunLight / maxLight;
    }
    generator.powerGenerated = powerGenerated;

    totalPowerGenerated += powerGenerated;

  }

  game.bases[game.playerID].totalPowerGenerated = totalPowerGenerated;
  game.bases[game.playerID].totalPowerNeeded = 0;

  // distribute consumed power
  for (const id in game.CONSUMER) {
    const consumer = game.entities[id];
    consumer.isPowered = false;
    game.bases[game.playerID].totalPowerNeeded += consumer.powerConsumed;
    if (totalPowerGenerated >= consumer.powerConsumed) {
      consumer.isPowered = true;
      totalPowerGenerated -= consumer.powerConsumed;
    }
  }

  game.bases[game.playerID].powerMargin =
    game.bases[game.playerID].totalPowerGenerated
    - game.bases[game.playerID].totalPowerNeeded;
};

const updateBases = (game: Game): void => {
  for (const id of game.BASE) {
    const base = game.entities[id];
    const collisions = collidesWith(game, base, Object.keys(Entities))
      .filter(e => e.isCollectable);
    for (const entity of collisions) {
      if (!isActionTypeQueued(entity, 'DIE')) {
        queueAction(game, entity, makeAction(game, entity, 'DIE'));
        const type = entity.collectedAs ? entity.collectedAs : entity.type;
        if (!entity.isCollectable) continue;
        if (game.bases[game.playerID].resources[type] == null) {
          game.bases[game.playerID].resources[type] = 0;
        }
        // pro-rate quantity based on hp
        let quantity = Math.ceil(entity.hp) / Entities[type].config.hp;
        game.bases[game.playerID].resources[type] += quantity;
      }
    }
  }
};

//////////////////////////////////////////////////////////////////////////
// Move controlledEntity/View
//////////////////////////////////////////////////////////////////////////

/**
 * If the queen isn't moving but you're still holding the key down,
 * then just put a move action back on the action queue
 */
const keepControlledMoving = (game: Game): void => {
  const controlledEntity = game.controlledEntity;
  if (!controlledEntity) return;
  const moveDir = {x: 0, y: 0};
  if (game.hotKeys.keysDown.up) {
    moveDir.y += 1;
  }
  if (game.hotKeys.keysDown.down) {
    moveDir.y -= 1;
  }
  if (game.hotKeys.keysDown.left) {
    moveDir.x -= 1;
  }
  if (game.hotKeys.keysDown.right) {
    moveDir.x += 1;
  }
  if (!equals(moveDir, {x: 0, y: 0})) {
    controlledEntity.timeOnMove += 1;
  } else {
    controlledEntity.timeOnMove = 0;
  }

  if (
    !equals(moveDir, {x: 0, y: 0}) && !isActionTypeQueued(controlledEntity, 'MOVE', true)
    && !isActionTypeQueued(controlledEntity, 'MOVE_TURN', true)
    && !isActionTypeQueued(controlledEntity, 'TURN') // enables turning in place
    && !isActionTypeQueued(controlledEntity, 'DASH')
  ) {
    const nextPos = add(controlledEntity.position, moveDir);
    const nextTheta = vectorTheta(subtract(controlledEntity.position, nextPos));
    let entityAction = makeAction(
      game, controlledEntity, 'MOVE',
      {
        nextPos,
        frameOffset: controlledEntity.frameOffset,
      },
    );
    if (!closeTo(nextTheta, controlledEntity.theta)) {
      if (controlledEntity.timeOnMove > 1) {
        entityAction = makeAction(
          game, controlledEntity, 'MOVE_TURN',
          {
            nextPos,
            nextTheta,
            frameOffset: controlledEntity.frameOffset,
          },
        );
        controlledEntity.prevTheta = controlledEntity.theta;
      } else {
        entityAction = makeAction(
          game, controlledEntity, 'TURN', nextTheta,
        );
      }
    }
    controlledEntity.timeOnMove = 0;
    queueAction(game, controlledEntity, entityAction);
  }
}

const updateViewPos = (
  game: Game,clampToGrid: boolean,
): void => {
  let nextViewPos = {...game.viewPos};
  const focusedEntity = game.focusedEntity;
  if (focusedEntity) {
    const moveDir = subtract(focusedEntity.position, focusedEntity.prevPosition);
    const action = focusedEntity.actions[0];
    if (
      action != null &&
      (action.type == 'MOVE' || action.type == 'DASH' || action.type == 'MOVE_TURN')
    ) {
      const index = getInterpolatedIndex(game, focusedEntity);
      const duration = getDuration(game, focusedEntity, action.type);
      nextViewPos = add(
        nextViewPos,
        scale(moveDir, game.timeSinceLastTick/duration),
      );
    } else if (action == null) {
      const idealPos = {
        x: focusedEntity.position.x - game.viewWidth / 2,
        y: focusedEntity.position.y - game.viewHeight /2,
      };
      const diff = subtract(idealPos, nextViewPos);
      // NOTE: this allows smooth panning to correct view position
      const duration = getDuration(game, focusedEntity, 'MOVE');
      nextViewPos = add(nextViewPos, scale(diff, 16/duration));
    }
  }

  // rumble screen from foot
  // const foot = game.entities[game.FOOT[0]];
  // if (foot != null && foot.actions[0] != null && foot.actions[0].type == 'STOMP') {
  //   const duration = getDuration(game, foot, 'STOMP');
  //   const actionIndex = duration - foot.actions[0].duration;
  //   if (gme.config.FOOT.rumbleTicks > actionIndex) {
  //     const magnitude = 4 * actionIndex / duration - 3;
  //     nextViewPos = {
  //       x: magnitude * Math.random() + queen.position.x - game.viewWidth / 2,
  //       y: magnitude * Math.random() + queen.position.y - game.viewHeight / 2,
  //     };
  //   } else if (!onScreen(game, foot) && actionIndex == gme.config.FOOT.rumbleTicks) {
  //     // if the foot doesn't stomp on screen, reset the view immediately after rumbling
  //     // else it looks jarring to shift the screen without the foot also moving
  //     if (focusedEntity != null) {
  //       nextViewPos = {
  //         x: focusedEntity.position.x - game.viewWidth / 2,
  //         y: focusedEntity.position.y - game.viewHeight /2,
  //       };
  //     }
  //   }
  // }

  nextViewPos = {
    x: Math.round(nextViewPos.x * 100) / 100,
    y: Math.round(nextViewPos.y * 100) / 100,
  };

  if (!clampToGrid) {
    if (!equals(game.viewPos, nextViewPos)) {
      game.viewPos = nextViewPos;
    }
  } else {
    game.viewPos = {
      x: clamp(nextViewPos.x, 0, game.gridWidth - game.viewWidth),
      y: clamp(nextViewPos.y, 0, game.gridHeight - game.viewHeight),
    };
  }
}

//////////////////////////////////////////////////////////////////////////
// Pheromones
//////////////////////////////////////////////////////////////////////////

const updatePheromoneEmitters = (game: Game): void => {
  for (const id in game.PHEROMONE_EMITTER) {
    const emitter = game.entities[id];
    if (emitter.quantity == 0) continue;
    if (emitter.refreshRate == null) continue;

    if ((game.time + emitter.id) % emitter.refreshRate == 0) {
      changePheromoneEmitterQuantity(game, emitter, emitter.quantity);
    }
  }
};

const updatePheromones = (game: Game): void => {

  if (game.time % globalConfig.config.dispersingPheromoneUpdateRate == 0) {
    game.pheromoneWorker.postMessage({
      type: 'DISPERSE_PHEROMONES',
    });
  }

  // recompute steady-state-based pheromones using the worker
  if (game.reverseFloodFillSources.length > 0) {
    game.pheromoneWorker.postMessage({
      type: 'REVERSE_FLOOD_FILL',
      reverseFloodFillSources: game.reverseFloodFillSources,
    });
    game.reverseFloodFillSources = [];
  }
  if (game.floodFillSources.length > 0) {
    game.pheromoneWorker.postMessage({
      type: 'FLOOD_FILL',
      floodFillSources: game.floodFillSources,
    });
    game.floodFillSources = [];
  }
};

//////////////////////////////////////////////////////////////////////////
// Doing Actions
//////////////////////////////////////////////////////////////////////////

const stepAction = (
  game: Game, entity: Entity, decisionFunction: mixed,
): void => {
  if (entity.actions == null || entity.actions.length == 0) return;

  let curAction = entity.actions[0];
  const totalDuration = getDuration(game, entity, curAction.type);
  if (
    totalDuration - curAction.duration >= curAction.effectIndex &&
    !curAction.effectDone
  ) {
    entityStartCurrentAction(game, entity);
    curAction = entity.actions[0];
  } else if (curAction.duration <= 0) {
    const prevAction = entity.actions.shift();
    entity.prevActionType = prevAction.type;
    curAction = entity.actions[0];
    if (curAction == null) {
      decisionFunction(game, entity);
      curAction = entity.actions[0];
    }
    if (curAction != null && curAction.effectIndex == 0) {
      entityStartCurrentAction(game, entity);
    }
  }
  if (curAction != null) {
    curAction.duration = Math.max(0, curAction.duration - game.timeSinceLastTick);
  }
}

//////////////////////////////////////////////////////////////////////////
// Misc.
//////////////////////////////////////////////////////////////////////////

const updateTiledSprites = (game): void => {
  for (const id of game.staleTiles) {
    const entity = game.entities[id];
    entity.dictIndexStr = getDictIndexStr(game, entity);
  }
  game.staleTiles = [];
}

const updateRain = (game): void => {
  if (game.rainTicks > 0) {
    game.rainTicks--;
  } else {
    game.timeSinceLastRain += game.timeSinceLastTick;
  }
}

const updateTicker = (game): void => {
  if (game.ticker == null) return;
  game.ticker.time -= game.timeSinceLastTick;
  if (game.ticker.time <= 0) {
    game.ticker = null;
  }
};

module.exports = {tickReducer};
