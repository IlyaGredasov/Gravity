import React, { useCallback, useEffect, useState, useRef } from "react";
import { Stage, Container } from "@pixi/react";
import { calculateCanvasSize } from "./common.ts";
import SpaceObjects from "./components/SpaceObjects.jsx";
import { socket } from "./socket.js";
import SimulationConfigurator from "./components/SimulationConfigurator.jsx";
import "./App.css";

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
      const newScale = Math.max(0.1, Math.min(5, scale * (event.deltaY > 0 ? 0.9 : 1.1)));
      setScale(newScale);
    },
    [scale]
  );

  const handleDragStart = useCallback((event) => {
    setDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY };
    dragOffset.current = { x: position.x, y: position.y };
  }, [position]);

  const handleDragMove = useCallback((event) => {
    if (dragging) {
      setPosition(() => ({
        x: dragOffset.current.x + (event.clientX - dragStart.current.x),
        y: dragOffset.current.y + (event.clientY - dragStart.current.y),
      }));
    }
  }, [dragging]);

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
        <SimulationConfigurator socketId={socketId} />
      </div>
      <div className="canvas-panel">
        <Stage width={canvasSize.width} height={canvasSize.height} options={{ backgroundColor: 0x000000 }} onWheel={handleWheel}>
          <Container scale={scale} x={position.x} y={position.y} interactive>
            <SpaceObjects positions={positions} canvasSize={canvasSize} scale={scale} />
          </Container>
        </Stage>
      </div>
    </div>
  );
};

export default App;
