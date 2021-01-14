// @flow

const React = require('react');
const Button = require('./Components/Button.react');
const Canvas = require('./Canvas.react');
const Checkbox = require('./Components/Checkbox.react');
const RadioPicker = require('./Components/RadioPicker.react');
const TopBar = require('./TopBar.react');
const {config} = require('../config');
const {initMouseControlsSystem} = require('../systems/mouseControlsSystem');
const {initGameOverSystem} = require('../systems/gameOverSystem');
const {initSpriteSheetSystem} = require('../systems/spriteSheetSystem');
const {initRainSystem} = require('../systems/rainSystem');
const {initPheromoneWorkerSystem} = require('../systems/pheromoneWorkerSystem');
const {
  initKeyboardControlsSystem
} = require('../systems/keyboardControlsSystem');
const ExperimentalSidebar = require('./ExperimentalSidebar.react');
const {useEffect, useState, useMemo, Component, memo} = React;
const {add, subtract} = require('../utils/vectors');
const {lookupInGrid} = require('../utils/gridHelpers');
const {clamp, isMobile} = require('../utils/helpers');
const {getControlledEntityInteraction} = require('../selectors/misc');
const {isActionTypeQueued} = require('../simulation/actionQueue');

import type {Action, State} from '../types';

type Props = {
  dispatch: (action: Action) => Action,
  store:  Object,
  isInLevelEditor: boolean,
  topBar: mixed,
  controlButtons: mixed,
  gameID: mixed,
  tickInterval: mixed,
};

function Game(props: Props): React.Node {
  const {dispatch, store, isInLevelEditor, gameID, tickInterval} = props;
  const state = store.getState();

  // init systems
  useEffect(() => {
    // trying to prevent pinch zoom
    document.addEventListener('touchmove', function (ev) {
      if (ev.scale !== 1) { ev.preventDefault(); }
    }, {passive: false});
    document.addEventListener('gesturestart', function (ev) {
      ev.preventDefault();
    }, {passive: false});
  }, []);
  useEffect(() => {
    initKeyboardControlsSystem(store);
    // initSpriteSheetSystem(store);
    initGameOverSystem(store);
    initPheromoneWorkerSystem(store);
    // initRainSystem(store);
    // initUpgradeSystem(store);
    registerHotkeys(dispatch);
    // initMouseControlsSystem(store, handlers);
  }, [gameID, tickInterval]);


  // ---------------------------------------------
  // memoizing UI stuff here
  // ---------------------------------------------
  const {game} = state;

  const elem = document.getElementById('background');
  const dims = useMemo(() => {
    const dims = {width: window.innerWidth, height: window.innerHeight};
    if (isInLevelEditor && elem != null) {
      const slider = document.getElementById('sliderBar');
      const editor = document.getElementById('levelEditor');
      let sliderWidth = slider != null ? slider.getBoundingClientRect().width : 0;
      let editorWidth = editor != null ? editor.getBoundingClientRect().width : 0;
      dims.width = dims.width - sliderWidth - editorWidth;
    }
    return dims;
  }, [window.innerWidth, window.innerHeight, elem != null]);

  return (
    <div
      className="background" id="background"
      style={{
        position: 'relative',
      }}
    >
      {
        state.screen == 'EDITOR'
          ? <ExperimentalSidebar state={state} dispatch={dispatch} />
          : null
      }
      <Canvas
        dispatch={dispatch}
        tickInterval={tickInterval}
        innerWidth={dims.width}
        innerHeight={dims.height}
        isExperimental={state.screen == 'EDITOR'}
        focusedEntity={game.focusedEntity}
      />
      <TopBar dispatch={dispatch}
        upgradedAt={game.upgradedAt}
        isExperimental={props.isInLevelEditor}
        tickInterval={state.game.tickInterval}
        modal={state.modal}
        innerWidth={window.innerWidth}
        isMuted={state.isMuted}
      />
    </div>
  );
}

function registerHotkeys(dispatch) {
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyDown',
    key: 'E',
    fn: (s) => {
      const game = s.getState().game;
      const controlledEntity = game.controlledEntity;
      if (!controlledEntity) return;

      const entityAction = getControlledEntityInteraction(game, controlledEntity);
      if (
        (entityAction.type == 'PICKUP' || entityAction.type == 'PUTDOWN') &&
        (
          isActionTypeQueued(controlledEntity, 'PICKUP') ||
          isActionTypeQueued(controlledEntity, 'PUTDOWN'))
      ) {
        return;
      }
      dispatch({
        type: 'ENQUEUE_ENTITY_ACTION',
        entity: controlledEntity,
        entityAction,
      });
    }
  });
}

module.exports = Game;
