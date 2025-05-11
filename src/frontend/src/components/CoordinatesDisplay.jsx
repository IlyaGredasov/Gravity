import React from 'react'

export const CoordinatesDisplay = React.memo(({ position, positions }) => {
  return (
    <div className="coordinates-display">
      <p>Center: ({-position.x.toFixed(2)}, {-position.y.toFixed(2)})</p>
      {positions.map((pos, index) => (
        <p key={index}>Object {index + 1}: ({pos.x.toFixed(2)}, {pos.y.toFixed(2)})</p>
      ))}
    </div>
  );
});

export default CoordinatesDisplay;