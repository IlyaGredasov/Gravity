import React from 'react';
import { Graphics } from '@pixi/react';

function SpaceObject({ pos, canvasSize }) {
  const x = canvasSize.width / 2 * 0.7 + pos.x;
  const y = canvasSize.height / 2 - pos.y;
  console.log(x, y)
  return (
    <Graphics
      draw={(g) => {
        g.clear();
        g.lineStyle(0);
        g.beginFill(0xffffff);
        g.drawCircle(x, y, pos.radius);
        g.endFill();
      }}
    />
  );
}

export default SpaceObject;