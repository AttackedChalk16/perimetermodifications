// @flow

const {
  subtract, add, makeVector, vectorTheta, round, rotate, floor,
} = require('../utils/vectors');
const {
  lookupInGrid, getEntityPositions, getPheromonesInCell,
} = require('../utils/gridHelpers');
const {onScreen, getPositionsInFront} = require('../selectors/misc');
const {renderHealthBar} = require('./renderHealthBar');
const {thetaToDir} = require('../utils/helpers');

const renderAgent = (ctx, game, agent: Agent, spriteRenderFn: () => {}): void => {
	ctx.save();

	// render relative to top left of grid square,
  // but first translate for rotation around the center
  // NOTE: to support NxM entities, width/height assumes an up-down orientation,
  // so when the agent is left-right, flip width and height
  const dir = thetaToDir(agent.theta);
  const width = dir == 'left' || dir == 'right' ? agent.height : agent.width;
  const height = dir == 'left' || dir == 'right' ? agent.width : agent.height;
	ctx.translate(
    agent.position.x + width / 2,
    agent.position.y + height / 2,
  );
  ctx.rotate(agent.theta - Math.PI / 2);
  ctx.translate(-agent.width / 2, -agent.height / 2);

  // render the specific agent here:
  spriteRenderFn(ctx, game, agent);

  ctx.translate(width / 2, height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.translate(-width / 2, -height / 2);

  // render hp bar
  // if (Math.ceil(agent.hp) < config[agent.playerID][agent.caste].hp) {
  //   renderHealthBar(ctx, agent, config[agent.playerID][agent.caste].hp);
  // }

  ctx.restore();

  // render positions in front
  if (game.showPositionsInFront) {
    const positionsInFront = getPositionsInFront(game, agent);
    for (const pos of positionsInFront) {
      const {x, y} = pos;
      ctx.strokeStyle = 'red';
      ctx.strokeRect(x, y, 1, 1);
    }
  }

  // render true position
  if (game.showTruePositions) {
    ctx.fillStyle = 'rgba(200, 0, 0, 0.4)';
    ctx.fillRect(agent.position.x, agent.position.y, 1, 1);
  }

  // render hitbox
  if (game.showHitboxes) {
    const positionsInFront = getEntityPositions(game, agent);
    for (const pos of positionsInFront) {
      const {x, y} = pos;
      ctx.strokeStyle = 'red';
      ctx.strokeRect(x, y, 1, 1);
    }
  }

  // render true hitbox
  if (game.showTrueHitboxes) {
    const entityPositions = [];
    for (let x = 0; x < game.gridWidth; x++) {
      for (let y = 0; y < game.gridHeight; y++) {
        const entitiesAtPos = lookupInGrid(game.grid, {x, y});
        for (const id of entitiesAtPos) {
          if (id == agent.id) {
            entityPositions.push({x, y});
          }
        }
      }
    }
    for (const pos of entityPositions) {
      const {x, y} = pos;
      ctx.strokeStyle = 'red';
      ctx.strokeRect(x, y, 1, 1);
    }
  }

  if (game.showAgentDecision && agent.decisions != null) {
    for (const decision of agent.decisions) {
      const {position, score, chosen} = decision;
      const {x, y} = position;
      if (chosen) {
        ctx.strokeStyle = 'red';
        ctx.strokeRect(x, y, 1, 1);
      }
      ctx.strokeStyle = 'black';
      ctx.fillStyle = 'black';
      ctx.font = '1px sans serif';
      ctx.fillText(parseInt(score), x, y + 1, 1);
    }
  }
};

module.exports = {renderAgent};
