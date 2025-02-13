import React, { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Stage } from "@pixi/react";
import { calculateCanvasSize } from "./common.ts";
import SpaceObjects from "./components/SpaceObjects.jsx";
import * as PIXI from "pixi.js";
import { socket } from "./socket.js";
import SimulationConfigurator from "./components/SimulationConfigurator.jsx";
import "./App.css";

const App = () => {
  const keyMap = new Map([['w', 'up'], ['s', 'down'], ['a', 'left'], ['d', 'right']]);
  const [canvasSize, setCanvasSize] = useState(calculateCanvasSize);
  const [positions, setPositions] = useState([]);
  const [socketId, setSocketId] = useState();

  const updateCanvasSize = useCallback(() => {
    setCanvasSize(calculateCanvasSize());
  }, []);

  useEffect(() => {
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [updateCanvasSize]);

  const parseData = (data) => {
    const parsedData = JSON.parse(data)
    return parsedData.map((obj) => {
      const [key] = Object.keys(obj);
      return obj[key];
    })
  }

  const handleKeyEvent = (event) => {
    const direction = keyMap.get(event.key.toLowerCase());
    if (direction) {
      socket.emit('button_press', {
        "is_pressed": event.type === 'keydown',
        "direction": direction,
      })
    }
  };


  useEffect(() => {
    window.addEventListener('keydown', handleKeyEvent);
    window.addEventListener('keyup', handleKeyEvent);

    socket.on("update_step", (data) => {
      setPositions(parseData(data));
    });

    socket.on('connect', () => {
      setSocketId(socket.id);
    });

    return () => {
      window.removeEventListener('keydown', handleKeyEvent);
      window.removeEventListener('keyup', handleKeyEvent);
    };
  }, []);

  return (
    <div className="simulation-container">
      <div className="configurator-panel">
        <SimulationConfigurator socketId={socketId} />
      </div>
      <div className="canvas-panel">
        <Stage width={canvasSize.width} height={canvasSize.height} options={{ backgroundColor: 0x000000 }}>
          <SpaceObjects positions={positions} canvasSize={canvasSize} socketId={socketId} socket={socket} />
        </Stage>
      </div>
    </div>
  );
  
};

export default App;
