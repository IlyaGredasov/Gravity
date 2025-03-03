import SpaceObject from './SpaceObject';


function SpaceObjects({ positions, canvasSize, scale}) {

  return (
      positions.map((pos, index) => (
        <SpaceObject key={index} pos={pos} canvasSize={canvasSize} scale={scale}/>
      ))
  );
}

export default SpaceObjects;

