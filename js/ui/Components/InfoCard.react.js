// @flow

const React = require('react');

const InfoCard = (props): React.Node => {
  return (
    <div
      style={{
        border: '1px solid black',
        backgroundColor: 'white',
        // width: 200,
        // height: 148,
        verticalAlign: 'top',
        marginLeft: 4,
        display: 'inline-block',
        padding: 4,
      }}
    >
      {props.children}
    </div>
  );
}

module.exports = InfoCard
