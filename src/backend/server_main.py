import json
import os
import traceback
from dataclasses import dataclass
from threading import Thread, Event

import numpy as np
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO

from space_computation import Simulation, SpaceObject, CollisionType, MovementType

app = Flask(__name__)
CORS(app)
load_dotenv('.env')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
socketio = SocketIO(app, async_mode="threading", cors_allowed_origins="*")

UserID = str


@dataclass
class SimulationExecutionPool:
    simulation: Simulation
    thread: Thread
    stop_event: Event


pools_dict: dict[UserID, SimulationExecutionPool] = {}


def stop_execution_pool(user_id: UserID):
    if user_id in pools_dict.keys():
        pools_dict[user_id].stop_event.set()
        pools_dict[user_id].thread.join()
        del pools_dict[user_id]


@socketio.on('disconnect')
def handle_disconnect():
    stop_execution_pool(request.sid)


@socketio.on('button_press')
def handle_button_press(data):
    user_id = request.sid
    if user_id in pools_dict.keys():
        simulation = pools_dict[user_id].simulation
        match data['direction']:
            case 'right':
                simulation.controllable_acceleration.right = data['is_pressed']
            case 'left':
                simulation.controllable_acceleration.left = data['is_pressed']
            case 'up':
                simulation.controllable_acceleration.up = data['is_pressed']
            case 'down':
                simulation.controllable_acceleration.down = data['is_pressed']
            case _:
                raise ValueError("Invalid direction")


@app.route('/launch_simulation', methods=['POST'])
def launch_simulation():
    data = request.json
    if data['user_id'] in pools_dict:
        stop_execution_pool(data['user_id'])
    try:
        time_delta = data.get('time_delta', Simulation.__init__.__defaults__[0])
        simulation_time = data.get('simulation_time', Simulation.__init__.__defaults__[1])
        G = data.get('G', Simulation.__init__.__defaults__[2])
        collision_type = data.get('collision_type', Simulation.__init__.__defaults__[3])
        acceleration_rate = data.get('acceleration_rate', Simulation.__init__.__defaults__[4])
        elasticity_coefficient = data.get('elasticity_coefficient', Simulation.__init__.__defaults__[5])
        simulation: Simulation = Simulation(space_objects=[
            SpaceObject(name=obj['name'], mass=obj['mass'], radius=obj['radius'],
                        position=np.array([obj['position']['x'], obj['position']['y']]),
                        velocity=np.array([obj['velocity']['x'], obj['velocity']['y']]),
                        movement_type=MovementType(int(obj['movement_type']))) for obj in data['space_objects']],
            time_delta=time_delta, simulation_time=simulation_time, G=G,
            collision_type=CollisionType(int(collision_type)), acceleration_rate=acceleration_rate,
            elasticity_coefficient=elasticity_coefficient)
        pools_dict[data['user_id']] = SimulationExecutionPool(
            simulation=simulation,
            thread=Thread(target=simulate, args=(request.json['user_id'],)),
            stop_event=Event()
        )
        pools_dict[data['user_id']].thread.start()
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'status': 'error', 'message': str(e)}), 400


@app.route("/delete_simulation", methods=["POST"])
def delete_simulation():
    stop_execution_pool(request.json['user_id'])
    return jsonify({'status': 'success'}), 200


def simulate(user_id: UserID):
    simulation = pools_dict[user_id].simulation
    i = 0
    while not pools_dict[user_id].stop_event.is_set() and i < int(simulation.simulation_time // simulation.time_delta):
        simulation.calculate_step()
        response: json = json.dumps(
            [{i: {"x": obj.position[0], "y": obj.position[1], "radius": obj.radius}} for i, obj in
             enumerate(simulation.space_objects)])
        socketio.emit('update_step', response, room=user_id)
        socketio.sleep(0.016)
        i += 1


if __name__ == "__main__":
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
