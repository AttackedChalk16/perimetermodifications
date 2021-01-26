
const React = require('react');
const AudioWidget = require('./Components/AudioWidget.react');
const Button = require('./Components/Button.react');
const Modal = require('./Components/Modal.react');
const globalConfig = require('../config');
const {getDisplayTime} = require('../utils/helpers');
const InfoCard = require('../ui/components/InfoCard.react');
const PlacementPalette = require('../ui/PlacementPalette.react');
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
          width: 200,
          marginLeft: 10,
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
        <PlacementPalette
          dispatch={dispatch}
          base={base}
          placeType={placeType}
        />
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


module.exports = TopBar;
