// @flow

const initPheromoneWorkerSystem = (store) => {
  const {dispatch} = store;
  const {game} = store.getState();

  game.pheromoneWorker.onmessage = (data) => {
    const message = data.data;
    switch (message.type) {
      case 'PHEROMONES':
        dispatch({type: 'UPDATE_ALL_PHEROMONES', pheromones: message.result});
        break;
      case 'TURBINES': {
        const {thetaSpeed, entityID} = message;
        dispatch({type: 'UPDATE_TURBINE', thetaSpeed, entityID});
        break;
      }
    }
  };
};

module.exports = {initPheromoneWorkerSystem};
