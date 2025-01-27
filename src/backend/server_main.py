import os

import numpy as np
from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO
from threading import Thread

from space_computation import Simulation, SpaceObject

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app, async_mode="threading")

sim = Simulation([SpaceObject("First", mass=1, radius=0.01, position=np.array([1, 0]), velocity=np.array([0, 0])),
                  SpaceObject("Second", mass=1, radius=0.01, position=np.array([-1, -1]), velocity=np.array([0, 0]))])
calculating_thread: Thread | None = None


def simulate(simulation: Simulation):
    for _ in range(int(simulation.simulation_time // simulation.time_delta)):
        simulation.calculate_step()
        str_response = "".join(str(obj)+os.linesep for obj in simulation.space_objects)
        socketio.emit('update_step', str_response)
        socketio.sleep(10**-10)


@app.route("/")
def index():
    return render_template("index.html")


@app.route('/launch_simulation', methods=['POST'])
def launch_simulation():
    global calculating_thread
    calculating_thread = Thread(target=simulate, args=(sim,))
    calculating_thread.start()
    return jsonify({'status': 'started'})


if __name__ == "__main__":
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
