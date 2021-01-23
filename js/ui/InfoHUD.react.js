// @flow

const React = require('react');
const {Entities} = require('../entities/registry');
const {pheromones} = require('../config');
const {encodePosition} = require('../utils/helpers');
const InfoCard = require('../ui/components/InfoCard.react');
const {lookupInGrid, getPheromonesInCell} = require('../utils/gridHelpers');
const {getPheromoneAtPosition} = require('../selectors/pheromones');

const InfoHUD = (props): React.Node => {
  const {mousePos, game} = props;

  const pheromoneInfoCards = [];
  const pherInCell = getPheromonesInCell(game.grid, mousePos, 0 /* playerID */);
  for (const pherType in pherInCell) {
    if (pherType == 'HEAT' || pherType == 'COLD') continue;
    if (pherInCell[pherType] > 0) {
      pheromoneInfoCards.push(
        <PheromoneInfoCard
          key={'pherInfo_' + pherType + encodePosition(mousePos) + pherInCell[pherType]}
          pheromoneType={pherType}
          quantity={pherInCell[pherType]}
        />
      );
    }
  }

  const entityInfoCards = lookupInGrid(game.grid, mousePos)
    .map(id => game.entities[id])
    .map(e => (<EntityInfoCard key={'info_' + e.id} entity={e} />));

  const temp = getPheromoneAtPosition(game, mousePos, 'HEAT', 0);

  return (
    <div
      style={{
      }}
    >
      <InfoCard>
        <div><b>Position: </b></div>
        <div>x: {mousePos.x} y: {mousePos.y}</div>
        <div><b>Temperature</b>: {temp}</div>
      </InfoCard>
      {entityInfoCards}
      {pheromoneInfoCards}
    </div>
  );
}

const PheromoneInfoCard = (props): React.Node => {
  const {pheromoneType, quantity} = props;
  const config = pheromones[pheromoneType];
  return (
    <InfoCard>
      <div style={{textAlign: 'center'}}><b>{pheromoneType}</b></div>
      <div>
        Concentration: {Math.round(quantity)}/{config.quantity}
        {config.heatPoint ? (<div>Boil Temp: {config.heatPoint}</div>) : null}
        {config.heatsTo ? (<div>Boils To: {config.heatsTo}</div>) : null}
        {config.coolPoint ? (<div>Cools At: {config.coolPoint}</div>) : null}
        {config.coolsTo ? (<div>Cools To: {config.coolsTo}</div>): null}
      </div>
    </InfoCard>
  );
}

const EntityInfoCard = (props): React.Node => {
  const {entity} = props;
  const config = Entities[entity.type].config;

  return (
    <InfoCard>
      <div style={{textAlign: 'center'}}><b>{entity.type}</b></div>
      {entity.hp ? (<div>HP: {entity.hp}/{config.hp}</div>) : null}
      {entity.fuel
        ? (<div>Fuel (seconds): {Math.round(entity.fuel/1000)}/{Math.round(config.fuel/1000)}</div>)
        : null
      }
      {entity.onFire != null ? (<div>On Fire: {entity.onFire ? 'Yes' : 'No'}</div>) : null}
      {entity.heatQuantity != null ? (<div>Fire Temp: {entity.heatQuantity}</div>) : null}
      {entity.combustionTemp != null
          ? (<div>Combustion Temp: {entity.combustionTemp}</div>)
          : null
      }
      {entity.powerConsumed != null ? (<div>Power Needed: {entity.powerConsumed}</div>) : null}
      {entity.isPowered != null ? (<div>Is Powered: {entity.isPowered ? 'Yes' : 'No'}</div>) : null}
      {entity.meltTemp != null ? (<div>Melts To: {entity.pheromoneType}</div>) : null}
      {entity.meltTemp != null ? (<div>Melt Temp: {entity.meltTemp}</div>) : null}
      {entity.damage ? (<div>Damage: {entity.damage}</div>) : null}
      {entity.powerGenerated != null
        ? (<div>Power Generated: {entity.powerGenerated.toFixed(2)}/{config.powerGenerated}</div>)
        : null
      }
    </InfoCard>
  );
}

module.exports = InfoHUD;
