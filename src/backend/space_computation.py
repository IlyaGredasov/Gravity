from enum import Enum
import numpy as np


class MovementType(Enum):
    STATIC = 0
    ORDINARY = 1
    CONTROLLABLE = 2


class SpaceObject:
    def __init__(self, name: str, mass: float, radius: float, position: np.array, velocity: np.array,
                 movement_type: MovementType = MovementType.ORDINARY):
        if len(velocity) != 2:
            raise ValueError("Velocity must contain 2 values")
        if len(position) != 2:
            raise ValueError("Position must contain 2 values")
        self.name: str = name
        self.mass: float = mass
        self.radius: float = radius
        self.position: np.array = position.astype(np.float64)
        self.velocity: np.array = velocity.astype(np.float64)
        self.acceleration: np.array = np.zeros(2).astype(np.float64)
        self.movement_type: MovementType = movement_type

    def __repr__(self):
        return (f"SpaceObject({self.name}, mass:{self.mass}, radius:{self.radius}, velocity:{self.velocity},"
                f"position:{self.position}, acceleration:{self.acceleration})")


class CollisionType(Enum):
    TRAVERSING = 0
    DESTRUCTIVE = 1
    ELASTIC = 2


def calculate_new_normal_velocity(first_mass, second_mass, first_velocity, second_velocity, elasticity, is_static):
    if is_static:
        return first_velocity
    return ((first_mass - elasticity * second_mass) * first_velocity + (
                1 + elasticity) * second_mass * second_velocity) / (first_mass + second_mass)


class Simulation:
    GRAVITATIONAL_CONSTANT: float = 10

    def __init__(self, space_objects: list[SpaceObject], time_delta: float = 10 ** -5,
                 collision_type: CollisionType = CollisionType.ELASTIC,
                 acceleration_rate: float = 1, elasticity_coefficient: float = 5, simulation_time: float = 10):
        self.space_objects: list[SpaceObject] = space_objects
        self.time_delta: float = time_delta
        self.collision_type: CollisionType = collision_type
        self.acceleration_rate: float = acceleration_rate
        self.elasticity_coefficient: float = elasticity_coefficient
        self.simulation_time: float = simulation_time

    def calculate_collisions(self) -> None:
        if self.collision_type == CollisionType.TRAVERSING:
            return
        collisions = []
        for i in range(len(self.space_objects)):
            for j in range(i + 1, len(self.space_objects)):
                if np.linalg.norm(self.space_objects[j].position - self.space_objects[i].position) <= \
                        self.space_objects[i].radius + self.space_objects[j].radius:
                    collisions.append((i, j))
        if self.collision_type == CollisionType.DESTRUCTIVE:
            destroyed = set()
            for i, j in collisions:
                destroyed.add(i)
                destroyed.add(j)
            for index in destroyed:
                self.space_objects.pop(index)
            return
        for i, j in collisions:
            normal_vector = (self.space_objects[j].position - self.space_objects[i].position) / np.linalg.norm(
                self.space_objects[j].position - self.space_objects[i].position)
            tangent_vector = np.array([-normal_vector[1], normal_vector[0]])

            normal_velocity_vector_i = np.dot(self.space_objects[i].velocity, normal_vector)
            tangent_velocity_vector_i = np.dot(self.space_objects[i].velocity, tangent_vector)
            normal_velocity_vector_j = np.dot(self.space_objects[j].velocity, normal_vector)
            tangent_velocity_vector_j = np.dot(self.space_objects[j].velocity, tangent_vector)
            new_normal_velocity_vector_i = calculate_new_normal_velocity(
                self.space_objects[i].mass,
                self.space_objects[j].mass,
                normal_velocity_vector_i,
                normal_velocity_vector_j,
                self.elasticity_coefficient,
                self.space_objects[i].movement_type == MovementType.STATIC
            )

            new_normal_velocity_vector_j = calculate_new_normal_velocity(
                self.space_objects[j].mass,
                self.space_objects[i].mass,
                normal_velocity_vector_j,
                normal_velocity_vector_i,
                self.elasticity_coefficient,
                self.space_objects[j].movement_type == MovementType.STATIC
            )

            self.space_objects[
                i].velocity = new_normal_velocity_vector_i * normal_vector + tangent_velocity_vector_i * tangent_vector
            self.space_objects[
                j].velocity = new_normal_velocity_vector_j * normal_vector + tangent_velocity_vector_j * tangent_vector

    def calculate_acceleration(self, i: int) -> np.array:
        if self.space_objects[i].movement_type == MovementType.STATIC:
            return np.zeros(2)
        return sum(Simulation.GRAVITATIONAL_CONSTANT * self.space_objects[j].mass / np.linalg.norm(
            self.space_objects[j].position - self.space_objects[i].position) ** 1.5 * (self.space_objects[j].position -
                                                                                       self.space_objects[i].position)
                   for j in range(len(self.space_objects)) if j != i)

    def calculate_step(self) -> None:
        self.calculate_collisions()
        for i in range(len(self.space_objects)):
            if self.space_objects[i].movement_type != MovementType.STATIC:
                self.space_objects[i].acceleration = self.calculate_acceleration(i)
                self.space_objects[i].position += self.space_objects[i].velocity * self.time_delta
                self.space_objects[i].velocity += self.space_objects[i].acceleration * self.time_delta
