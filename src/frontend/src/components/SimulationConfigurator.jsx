import React, { useState } from "react";
import "./SimulationConfigurator.css";

const SimulationConfigurator = ({ socketId }) => {
  const [simulationParams, setSimulationParams] = useState({
    user_id: socketId,
    space_objects: [
      { name: "first", mass: 1, radius: 50, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, movement_type: 2 },
      { name: "first", mass: 10, radius: 50, position: { x: 100, y: 100 }, velocity: { x: 0, y: 0 }, movement_type: 2 }
    ],
    time_delta: 0.5,
    simulation_time: 100000000,
    G: 10,
    collision_type: 1,
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

  const deleteSpaceObject = (index) => {
    setSimulationParams((prev) => {
      const updatedObjects = prev.space_objects.filter((_, i) => i !== index);
      return { ...prev, space_objects: updatedObjects };
    });
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

  const handleDeleteSimulation = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/delete_simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "user_id": socketId })
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
          Скорость:
          <input type="number" step={0.01} name="time_delta" value={simulationParams.time_delta} onChange={handleChange} />
        </label>
        <label>
          Длительность:
          <input type="number" name="simulation_time" value={simulationParams.simulation_time} onChange={handleChange} />
        </label>
        <label>
          G:
          <input type="number" step={0.1} name="G" value={simulationParams.G} onChange={handleChange} />
        </label>
        <label>
          Тип колизии:
          <select name="collision_type" value={simulationParams.collision_type} onChange={handleChange}>
            <option value={0}>Проходящая</option>
            <option value={1}>Упругая</option>
          </select>
        </label>
        <label>
          Темп ускорения:
          <input type="range" name="acceleration_rate" value={simulationParams.acceleration_rate} onChange={handleChange} />
        </label>
        <label>
          Коэффициент эластичности:
          <input type="range" name="elasticity_coefficient" value={simulationParams.elasticity_coefficient} onChange={handleChange} />
        </label>
        <div className="space-objects-container">
          <h3>Объекты</h3>
          {simulationParams.space_objects.map((obj, index) => (
            <div key={index} className="space-object">
              <input type="text" placeholder="Имя" value={obj.name} onChange={(e) => handleSpaceObjectChange(index, "name", e.target.value)} />
              <input type="number" placeholder="Масса" value={obj.mass} onChange={(e) => handleSpaceObjectChange(index, "mass", e.target.value)} />
              <input type="number" placeholder="Радиус" value={obj.radius} onChange={(e) => handleSpaceObjectChange(index, "radius", e.target.value)} />
              <input type="number" placeholder="Позиция X" value={obj.position.x} onChange={(e) => handleSpaceObjectChange(index, "position", { ...obj.position, x: e.target.value })} />
              <input type="number" placeholder="Позиция Y" value={obj.position.y} onChange={(e) => handleSpaceObjectChange(index, "position", { ...obj.position, y: e.target.value })} />
              <input type="number" placeholder="Скорость по X" value={obj.velocity.x} onChange={(e) => handleSpaceObjectChange(index, "velocity", { ...obj.velocity, x: e.target.value })} />
              <input type="number" placeholder="Скорость по Y" value={obj.velocity.y} onChange={(e) => handleSpaceObjectChange(index, "velocity", { ...obj.velocity, y: e.target.value })} />
              <select name="movement_type" value={obj.movement_type} onChange={(e) => handleSpaceObjectChange(index, "movement_type", e.target.value)}>
                <option value={0}>Статический</option>
                <option value={1}>Стандартный</option>
                <option value={2}>Управляемый</option>
              </select>
              <button type="button" onClick={() => deleteSpaceObject(index)}>Удалить</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addSpaceObject}>Добавить объект</button>
        <button type="button" onClick={handleLaunchSimulation}>Запустить</button>
        <button type="button" onClick={handleDeleteSimulation}>Остановить</button>
      </div>
    </form>
  );
};

export default SimulationConfigurator;