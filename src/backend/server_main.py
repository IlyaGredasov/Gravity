import os
import json

import numpy as np
from dotenv import load_dotenv
from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO
from threading import Thread

from space_computation import Simulation, SpaceObject, CollisionType, MovementType

app = Flask(__name__)
load_dotenv('.env')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
socketio = SocketIO(app, async_mode="threading")

users_dict: dict[str, str] = {}
simulations_dict: dict[str, Simulation] = {}
threads_dict: dict[str, Thread] = {}


def simulate(user_id: str):
    simulation = simulations_dict[user_id]
    for _ in range(int(simulation.simulation_time // simulation.time_delta)):
        simulation.calculate_step()
        response: json = json.dumps(
            [{i: {"x": obj.position[0], "y": obj.position[1]}} for i, obj in enumerate(simulation.space_objects)])
        socketio.emit('update_step', response, room=user_id)
        socketio.sleep(0.016)

@socketio.on('disconnect')
def handle_disconnect():
    user_id = request.sid
    if user_id in simulations_dict.keys():
        del simulations_dict[user_id]
    if user_id in threads_dict.keys():
        threads_dict[user_id].join()
        del threads_dict[user_id]


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/set_simulation", methods=["POST"])
def set_simulation():
    data = request.json
    try:
        if len(list(filter(lambda x: x['movement_type'] == MovementType.CONTROLLABLE, data['space_objects']))) > 1:
            raise ValueError("Multiple controllable objects are not supported")
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
            time_delta=time_delta, simulation_time=simulation_time,
            G=G,
            collision_type=CollisionType(int(collision_type)), acceleration_rate=acceleration_rate,
            elasticity_coefficient=elasticity_coefficient)
        simulations_dict[data['user_id']] = simulation
        return jsonify({'status': 'success'}), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400


@app.route('/launch_simulation', methods=['POST'])
def launch_simulation():
    user_thread = Thread(target=simulate, args=(request.json['user_id'],))
    user_thread.start()
    return jsonify({'status': 'started'})


if __name__ == "__main__":
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
