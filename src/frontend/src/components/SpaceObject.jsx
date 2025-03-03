import React from 'react';
import { Graphics } from '@pixi/react';

function SpaceObject({ pos, canvasSize, scale, position}) {
  const x = (canvasSize.width / 2 - canvasSize.width * 0.15 + pos.x) / scale;
  const y = (canvasSize.height / 2 + pos.y) / scale;
  return (
    <Graphics
      draw={(g) => {
        g.clear();
        g.lineStyle(0);
        g.beginFill(0xffffff);
        g.drawCircle(x, y, pos.radius * scale);
        g.endFill();
      }}
    />
  );
}

export default SpaceObject;