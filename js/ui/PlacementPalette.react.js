// @flow

const React = require('react');
const InfoCard = require('../ui/Components/InfoCard.react');
const {Entities} = require('../entities/registry');
const {canAffordBuilding} = require('../selectors/misc');

function PlacementPalette(props): React.Node {
  const {dispatch, base, placeType} = props;

  const placeEntityCards = []
  for (const entityType in Entities) {
    const config = Entities[entityType].config;
    if (!config.isCollectable) continue;
    placeEntityCards.push(
      <PlaceEntityCard key={"placeEntityCard_" + entityType}
        dispatch={dispatch}
        entityType={entityType}
        quantity={base.resources[entityType] || 0}
        isSelected={entityType == placeType}
      />
    );
    if (entityType == 'COAL') {
      placeEntityCards.push(
        <PlaceEntityCard key={"placeEntityCard_HOT_COAL"}
          dispatch={dispatch}
          entityType={'HOT COAL'}
          quantity={base.resources.COAL || 0}
          isSelected={'HOT COAL' == placeType}
        />
      );
    }
  }
  const placeBuildingCards = []
  for (const entityType in Entities) {
    const config = Entities[entityType].config;
    if (config.cost == null) continue;
    placeBuildingCards.push(
      <PlaceBuildingCard key={"placeEntityCard_" + entityType}
        dispatch={dispatch}
        base={base}
        entityType={entityType}
        cost={config.cost}
        isSelected={entityType == placeType}
      />
    );
  }

  return (
    <span>
      <div>{placeEntityCards}</div>
      <div>{placeBuildingCards}</div>
    </span>
  );
}

function PlaceEntityCard(props) {
  const {dispatch, entityType, quantity, isSelected} = props;
  return (
    <div
      style={{
        display: 'inline-block',
      }}
      onClick={() => dispatch({type: 'SET_PLACE_TYPE', placeType: entityType})}
    >
      <InfoCard
        border={isSelected ? '2px solid orange' : null}
        opacity={quantity != null && quantity > 0 ? null : 0.5}
      >
        <div><b>{entityType}</b></div>
        <div>{quantity}</div>
      </InfoCard>
    </div>
  );
}

function PlaceBuildingCard(props) {
  const {dispatch, entityType, cost, isSelected, base} = props;

  const costBreakdown = [];
  for (const type in cost) {
    costBreakdown.push(<div key={"cost_" + entityType + "_" + type}>
      {type}: {cost[type]}
    </div>);
  }

  return (
    <div
      style={{
        display: 'inline-block',
      }}
      onClick={() => dispatch({type: 'SET_PLACE_TYPE', placeType: entityType})}
    >
      <InfoCard
        border={isSelected ? '2px solid orange' : null}
        opacity={canAffordBuilding(base, cost) ? null : 0.5}
      >
        <div><b>{entityType}</b></div>
        <div>Cost:</div>
        {costBreakdown}
      </InfoCard>
    </div>
  );
}

module.exports = PlacementPalette;
