import React, { useState } from "react";
import { socket } from "../socket";
import "./SimulationConfigurator.css";

const SimulationConfigurator = ({ onSubmit, socketId }) => {
  const [simulationParams, setSimulationParams] = useState({
    user_id: socketId,
    space_objects: [
      { name: "first", mass: 1, radius: 50, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, movement_type: 0 }
    ],
    time_delta: 0.01,
    simulation_time: 10,
    G: 10,
    collision_type: 0,
    acceleration_rate: 1.0,
    elasticity_coefficient: 1.0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSimulationParams((prev) => ({
      ...prev,
      [name]: isNaN(Number(value)) ? value : parseFloat(value),
    }));
  };

  const handleSpaceObjectChange = (index, field, value) => {
    setSimulationParams((prev) => {
      const updatedObjects = [...prev.space_objects];
      updatedObjects[index][field] = isNaN(Number(value)) ? value : parseFloat(value);
      return { ...prev, space_objects: updatedObjects };
    });
  };

  const addSpaceObject = () => {
    setSimulationParams((prev) => ({
      ...prev,
      space_objects: [
        ...prev.space_objects,
        { name: "", mass: 1, radius: 1, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, movement_type: 0 },
      ],
    }));
  };

  const handleLaunchSimulation = async (e) => {
    e.preventDefault();
    simulationParams.elasticity_coefficient /= 100;
    simulationParams.user_id = socketId;
    console.log(simulationParams);
    try {
      const response = await fetch('http://localhost:5000/launch_simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulationParams)
      });
      if (!response.ok) { throw new Error("Not ok") }
      const result = await response.json();
      console.log("Success", result);
    } catch (error) { console.error(error) }
  };

  return (
    <form onSubmit={handleLaunchSimulation} className="simulator-config">
      <h2 className="config-title">Simulation Configurator</h2>
      <div className="form-section">
        <label>
          Time Delta:
          <input type="number" step={0.01} name="time_delta" value={simulationParams.time_delta} onChange={handleChange} />
        </label>
        <label>
          Simulation Time:
          <input type="number" name="simulation_time" value={simulationParams.simulation_time} onChange={handleChange} />
        </label>
        <label>
          Gravitational Constant (G):
          <input type="number" step={0.1} name="G" value={simulationParams.G} onChange={handleChange} />
        </label>
        <label>
          Collision Type:
          <select name="collision_type" value={simulationParams.collision_type} onChange={handleChange}>
            <option value={0}>Traversing</option>
            <option value={1}>Elastic</option>
          </select>
        </label>
        <label>
          Acceleration Rate:
          <input type="range" name="acceleration_rate" value={simulationParams.acceleration_rate} onChange={handleChange} />
        </label>
        <label>
          Elasticity Coefficient:
          <input type="range" name="elasticity_coefficient" value={simulationParams.elasticity_coefficient} onChange={handleChange} />
        </label>
        <h3>Space Objects</h3>
        {simulationParams.space_objects.map((obj, index) => (
          <div key={index} className="space-object">
            <input type="text" placeholder="Name" value={obj.name} onChange={(e) => handleSpaceObjectChange(index, "name", e.target.value)} />
            <input type="number" placeholder="Mass" value={obj.mass} onChange={(e) => handleSpaceObjectChange(index, "mass", e.target.value)} />
            <input type="number" placeholder="Radius" value={obj.radius} onChange={(e) => handleSpaceObjectChange(index, "radius", e.target.value)} />
            <input type="number" placeholder="Position X" value={obj.position.x} onChange={(e) => handleSpaceObjectChange(index, "position", { ...obj.position, x: e.target.value })} />
            <input type="number" placeholder="Position Y" value={obj.position.y} onChange={(e) => handleSpaceObjectChange(index, "position", { ...obj.position, y: e.target.value })} />
            <input type="number" placeholder="Velocity X" value={obj.velocity.x} onChange={(e) => handleSpaceObjectChange(index, "velocity", { ...obj.velocity, x: e.target.value })} />
            <input type="number" placeholder="Velocity Y" value={obj.velocity.y} onChange={(e) => handleSpaceObjectChange(index, "velocity", { ...obj.velocity, y: e.target.value })} />
            <input type="number" placeholder="Movement Type" value={obj.movement_type} onChange={(e) => handleSpaceObjectChange(index, "movement_type", e.target.value)} />
          </div>
        ))}
        <button type="button" onClick={addSpaceObject}>Add Space Object</button>
        <button type="submit">Start Simulation</button>
        <button type="button" onClick={handleLaunchSimulation}>Launch Simulation</button>
      </div>
    </form>
  );
};

export default SimulationConfigurator;