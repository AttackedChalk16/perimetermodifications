
const React = require('react');
const AudioWidget = require('./Components/AudioWidget.react');
const Button = require('./Components/Button.react');
const Modal = require('./Components/Modal.react');
const globalConfig = require('../config');
const {getDisplayTime} = require('../utils/helpers');
const InfoCard = require('../ui/components/InfoCard.react');
const {memo} = React;
const {Entities} = require('../entities/registry');

function TopBar(props) {
  const {
    dispatch,
    isExperimental,
    modal,
    tickInterval,
    canvasWidth,
    isMuted,
    totalPowerGenerated,
    powerMargin,
    totalPowerNeeded,
    base,
    placeType,
  } = props;

  if (isExperimental && tickInterval == null) {
    return null
  }

  const height = 100;
  const topPadding = 8;
  const leftPadding = canvasWidth / 2 - 100;
  let powerStuff = (
    <div>
      <div><b>Power Generated: </b>{totalPowerGenerated}</div>
      <div><b>Power Consumed: </b>{totalPowerNeeded}</div>
      <div><b>Power Available: </b>
        <span style={{color: powerMargin > 0 ? 'green' : 'red'}}>{powerMargin}</span>
      </div>
    </div>
  );

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
  }
  const placeBuildingCards = []
  for (const entityType in Entities) {
    const config = Entities[entityType].config;
    if (config.cost == null) continue;
    placeBuildingCards.push(
      <PlaceBuildingCard key={"placeEntityCard_" + entityType}
        dispatch={dispatch}
        entityType={entityType}
        cost={config.cost}
        isSelected={entityType == placeType}
      />
    );
  }
  let placingStuff = (
    <span>
      <div>{placeEntityCards}</div>
      <div>{placeBuildingCards}</div>
    </span>
  );

  return (
    <div
      id="topBar"
      style={{
        position: 'absolute',
        top: topPadding,
        height,
        width: '100%',
        zIndex: 2,
        textShadow: '-1px -1px 0 #FFF, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
      }}
    >
      <div
        style={{
          // float: 'left',
          paddingLeft: 8,
          display: 'inline-block',
        }}
      >
        <AudioWidget
          audioFiles={globalConfig.config.audioFiles}
          isShuffled={false}
          isMuted={isMuted}
          setIsMuted={() => {
            store.dispatch({type: 'SET_IS_MUTED', isMuted: !isMuted});
          }}
          style={{
          }}
        />
        <div>
          <Button
            label="Instructions"
            onClick={() => {
              instructionsModal(dispatch);
            }}
          />
        </div>
        <div>
          <Button
            label={tickInterval ? 'Pause' : 'Play'}
            disabled={modal != null}
            onClick={() => {
              if (tickInterval != null) {
                dispatch({type: 'STOP_TICK'});
              } else {
                dispatch({type: 'START_TICK'});
              }
            }}
          />
        </div>
      </div>
      <div
        style={{
          // left: leftPadding,
          display: 'inline-block',
          // position: 'absolute',
        }}
      >
        {powerStuff}
      </div>
      <div
        style={{
          display: 'inline-block',
          verticalAlign: 'top',
        }}
      >
        {placingStuff}
      </div>
    </div>
  );
}

function instructionsModal(dispatch) {
  dispatch({type: 'STOP_TICK'});
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyUp',
    key: 'enter',
    fn: (s) => dismissModal(s.dispatch),
  });
  dispatch({
    type: 'SET_MODAL',
    modal: (<Modal
      title="Instructions"
      body={(<span style={{textAlign: 'initial'}}>
        <div>
          <div style={{textAlign: 'center'}}><b>Controls:</b></div>TBD
        </div>
        <div>
          <div style={{textAlign: 'center'}}><b>Goal:</b></div>TBD
        </div>
      </span>)}
      buttons={[{label: 'Dismiss (Enter)', onClick: () => {
        dismissModal(dispatch);
      }}]}
    />),
  });
}

function dismissModal(dispatch) {
  dispatch({type: 'DISMISS_MODAL'});
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyUp',
    key: 'enter',
    fn: (s) => {},
  });
  dispatch({type: 'START_TICK'});
}

function PlaceEntityCard(props) {
  const {dispatch, entityType, quantity, isSelected} = props;
  let selectedStyle = {
    border: '4px solid red',
  }
  if (!isSelected) {
    selectedStyle = {};
  }
  return (
    <div
      style={{
        ...selectedStyle,
        display: 'inline-block',
      }}
      onClick={() => dispatch({type: 'SET_PLACE_TYPE', placeType: entityType})}
    >
      <InfoCard>
        <div><b>{entityType}</b></div>
        <div>{quantity}</div>
      </InfoCard>
    </div>
  );
}

function PlaceBuildingCard(props) {
  const {dispatch, entityType, cost, isSelected} = props;
  let selectedStyle = {
    border: '4px solid red',
  }
  if (!isSelected) {
    selectedStyle = {};
  }

  const costBreakdown = [];
  for (const type in cost) {
    costBreakdown.push(<div key={"cost_" + entityType + "_" + type}>
      {type}: {cost[type]}
    </div>);
  }

  return (
    <div
      style={{
        ...selectedStyle,
        display: 'inline-block',
      }}
      onClick={() => dispatch({type: 'SET_PLACE_TYPE', placeType: entityType})}
    >
      <InfoCard>
        <div><b>{entityType}</b></div>
        <div>Cost:</div>
        {costBreakdown}
      </InfoCard>
    </div>
  );
}

module.exports = TopBar;
