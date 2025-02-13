import SpaceObject from './SpaceObject';


function SpaceObjects({ positions, canvasSize }) {

  return (
      positions.map((pos, index) => (
        <SpaceObject key={index} pos={pos} canvasSize={canvasSize} />
      ))
  );
}

export default SpaceObjects;

