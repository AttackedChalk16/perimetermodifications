
const React = require('react');
const AudioWidget = require('./Components/AudioWidget.react');
const Button = require('./Components/Button.react');
const Modal = require('./Components/Modal.react');
const globalConfig = require('../config');
const {getDisplayTime} = require('../utils/helpers');
const {memo} = React;

function TopBar(props) {
  const {
    dispatch,
    isExperimental,
    modal,
    tickInterval,
    innerWidth,
    isMuted,
  } = props;

  if (isExperimental && tickInterval == null) {
    return null
  }

  const height = 100;
  const topPadding = 8;
  const leftPadding = innerWidth / 2 - 100;
  let centralStuff = '';

  return (
    <div
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
          float: 'left',
          paddingLeft: 8,
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
          float: 'right',
          paddingRight: 8,
        }}
      >
        <Button
          label="+"
          onClick={() => dispatch({type: 'SWAP_MINI_MAP'})}
        />
      </div>
      <div
        style={{
          left: leftPadding,
          position: 'absolute',
        }}
      >
        {centralStuff}
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

module.exports = memo(TopBar);
