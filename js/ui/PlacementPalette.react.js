// @flow

const React = require('react');
const InfoCard = require('../ui/Components/InfoCard.react');
const globalConfig = require('../config');
const {Entities} = require('../entities/registry');
const {
  canAffordBuilding, getModifiedCost,
} = require('../selectors/buildings');
const {useMemo, useEffect} = React;

function PlacementPalette(props): React.Node {
  const {dispatch, game, base, placeType} = props;

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
        cost={getModifiedCost(game, entityType)}
        isSelected={entityType == placeType}
      />
    );
  }

  return (
    <span>
      <div style={{marginBottom: 6}}>{placeEntityCards}</div>
      <div>{placeBuildingCards}</div>
    </span>
  );
}

function PlaceEntityCard(props) {
  const {dispatch, entityType, quantity, isSelected} = props;

  const hover = useMemo(() => {
    return (
      <HoverCard entityType={entityType} depth={0} />
    );
  }, []);
  return (
    <div
      style={{
        display: 'inline-block',
        position: 'relative',
      }}
      className='displayChildOnHover'
      onClick={() => dispatch({type: 'SET_PLACE_TYPE', placeType: entityType})}
    >
      <InfoCard
        border={isSelected ? '2px solid orange' : null}
        opacity={quantity != null && quantity > 0 ? null : 0.5}
      >
        <div><b>{entityType}</b></div>
        <div>{quantity.toFixed(1)}</div>
      </InfoCard>
      {hover}
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

  const hover = useMemo(() => {
    return (
      <HoverCard entityType={entityType} depth={0} />
    );
  }, []);

  return (
    <div
      style={{
        display: 'inline-block',
        position: 'relative',
      }}
      className='displayChildOnHover'
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
      {hover}
    </div>
  );
}

function HoverCard(props) {
  const {entityType, depth} = props;
  const allDescriptions = globalConfig.config.descriptions;
  const {description, howToMake} = allDescriptions[entityType];

  let hoverableDescription = [];
  let hoverableHowToMake = [];
  if (depth < 4) {
    const splitDescription = description.split(' ');
    for (let term of splitDescription) {
      if (term == 'HOT_COAL') term = 'HOT COAL';
      if (allDescriptions[term] != null) {
        hoverableDescription.push(
          <div
            style={{
              display: 'inline'
            }}
            key={"hoverDesc_" + entityType + "_" + term + depth}
            className="displayChildOnHover"
          >
            <b><span style={{color: 'steelblue'}}>{term}</span></b>
            <HoverCard entityType={term} depth={depth + 1} />
          </div>
        );
        hoverableDescription.push(' ');
      } else {
        hoverableDescription.push(term + ' ');
      }
    }
    let splitHowToMake = [];
    if (howToMake != null) {
      splitHowToMake = howToMake.split(' ');
    }
    for (let term of splitHowToMake) {
      if (term == 'HOT_COAL') term = 'HOT COAL';
      if (allDescriptions[term] != null) {
        hoverableHowToMake.push(
          <div
            style={{
              display: 'inline'
            }}
            key={"hoverHowTo_" + entityType + "_" + term + depth}
            className="displayChildOnHover"
          >
            <b><span style={{color: 'steelblue'}}>{term}</span></b>
            <HoverCard entityType={term} depth={depth + 1} />
          </div>
        );
        hoverableHowToMake.push(' ');
      } else {
        hoverableHowToMake.push(term + ' ');
      }
    }
  } else {
    hoverableDescription = description;
    hoverableHowToMake = howToMake;
  }

  return (
    <div
      className="hidden"
      style={{
        position: 'absolute',
        top: 35,
        left: 35,
        width: 300,
        zIndex: depth + 5,
      }}
    >
      <InfoCard >
        <div style={{textAlign: 'center'}}><b>
          {depth == 0 ? "Details" : entityType}
        </b></div>
        <div>{hoverableDescription}</div>
        {howToMake != null ? (<div><b>Made From: </b>{hoverableHowToMake}</div>) : null}
      </InfoCard>
    </div>
  );
}

module.exports = PlacementPalette;
