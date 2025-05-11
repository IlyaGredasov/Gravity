import React, { useCallback, useEffect, useState, useRef } from "react";
import { Stage, Container } from "@pixi/react";
import { calculateCanvasSize } from "./common.ts";
import SpaceObjects from "./components/SpaceObjects.jsx";
import { socket } from "./socket.js";
import SimulationConfigurator from "./components/SimulationConfigurator.jsx";
import "./App.css";

const CoordinatesDisplay = ({ position, positions }) => {
  return (
    <div className="coordinates-display">
      <p>Center: ({-position.x.toFixed(2)}, {-position.y.toFixed(2)})</p>
      {positions.map((pos, index) => (
        <p key={index}>Object {index + 1}: ({pos.x.toFixed(2)}, {pos.y.toFixed(2)})</p>
      ))}
    </div>
  );
};

const App = () => {
  const keyMap = new Map([
    ["w", "down"],
    ["s", "up"],
    ["a", "left"],
    ["d", "right"],
  ]);
  const [canvasSize, setCanvasSize] = useState(calculateCanvasSize);
  const [positions, setPositions] = useState([]);
  const [socketId, setSocketId] = useState();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });

  const updateCanvasSize = useCallback(() => {
    setCanvasSize(calculateCanvasSize());
  }, []);

  useEffect(() => {
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [updateCanvasSize]);

  useEffect(() => {
    const handleKeyEvent = (event) => {
      const direction = keyMap.get(event.key.toLowerCase());
      if (direction) {
        socket.emit("button_press", {
          is_pressed: event.type === "keydown",
          direction: direction,
        });
      }
    };

    window.addEventListener("keydown", handleKeyEvent);
    window.addEventListener("keyup", handleKeyEvent);

    socket.on("update_step", (data) => {
      setPositions(JSON.parse(data).map((obj) => Object.values(obj)[0]));
    });

    socket.on("connect", () => {
      setSocketId(socket.id);
    });

    return () => {
      window.removeEventListener("keydown", handleKeyEvent);
      window.removeEventListener("keyup", handleKeyEvent);
    };
  });

  const handleWheel = useCallback((event) => {
  
    const stage = event.currentTarget;
    const rect = stage.getBoundingClientRect();
    
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const worldXBefore = (mouseX - canvasSize.width / 2 - position.x * scale) / scale;
    const worldYBefore = (mouseY - canvasSize.height / 2 - position.y * scale) / scale;
    
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, scale * delta));
    
    const newPosition = {
      x: (mouseX - canvasSize.width / 2 - worldXBefore * newScale) / newScale,
      y: (mouseY - canvasSize.height / 2 - worldYBefore * newScale) / newScale,
    };
    
    setScale(newScale);
    setPosition(newPosition);
  }, [scale, position, canvasSize]);
  
  const handleDragStart = useCallback((event) => {
    if (event.target.localName !== "canvas") return
    setDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY };
    dragOffset.current = { x: position.x, y: position.y };
  }, [position]);

  const handleDragMove = useCallback((event) => {
    if (dragging) {
      const deltaX = (event.clientX - dragStart.current.x) / scale;
      const deltaY = (event.clientY - dragStart.current.y) / scale;
      
      setPosition({
        x: dragOffset.current.x + deltaX,
        y: dragOffset.current.y + deltaY,
      });
    }
  }, [dragging, scale]);

  const handleDragEnd = useCallback(() => {
    setDragging(false);
  }, []);

  return (
    <div
      className="simulation-container"
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      <div className="configurator-panel">
        <SimulationConfigurator socketId={socketId} setPosition={setPosition} />
      </div>
      <div className="canvas-panel">
        <Stage width={canvasSize.width} height={canvasSize.height} options={{ backgroundColor: 0x000000 }} onWheel={handleWheel}>
          <Container scale={scale} x={canvasSize.width/2 + position.x*scale} y={canvasSize.height / 2 + position.y*scale}>
            <SpaceObjects positions={positions} />
          </Container>
        </Stage>
      </div>
      <CoordinatesDisplay position={position} positions={positions} />
    </div>
  );
};

export default App;
