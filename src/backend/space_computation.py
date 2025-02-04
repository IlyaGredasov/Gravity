from dataclasses import dataclass
from enum import Enum
from typing import Literal

import numpy as np


class MovementType(Enum):
    STATIC = 0
    ORDINARY = 1
    CONTROLLABLE = 2


class SpaceObject:
    def __init__(self, name: str, mass: float, radius: float, position: np.array, velocity: np.array,
                 movement_type: MovementType = MovementType.ORDINARY):

        self.name: str = name
        if mass <= 0:
            raise ValueError("Mass must be positive")
        self.mass: float = mass
        if radius <= 0:
            raise ValueError("Radius must be positive")
        self.radius: float = radius
        if len(position) != 2:
            raise ValueError("Position must contain 2 values")
        self.position: np.array = position.astype(np.float64)
        if len(velocity) != 2:
            raise ValueError("Velocity must contain 2 values")
        self.velocity: np.array = np.zeros(2).astype(
            np.float64) if movement_type == MovementType.STATIC else velocity.astype(np.float64)
        self.acceleration: np.array = np.zeros(2).astype(np.float64)
        if movement_type not in [MovementType.STATIC, MovementType.ORDINARY, MovementType.CONTROLLABLE]:
            raise ValueError("Invalid movement_type")
        self.movement_type: MovementType = movement_type

    def __repr__(self):
        return (f"SpaceObject({self.name}, mass:{self.mass}, radius:{self.radius}, position:{self.position},"
                f"velocity:{self.velocity}, acceleration:{self.acceleration}), MovementType={self.movement_type}")


class CollisionType(Enum):
    TRAVERSING = 0
    ELASTIC = 1


@dataclass
class ControllableAcceleration:
    right: Literal[0] | Literal[1] = 0
    left: Literal[0] | Literal[1] = 0
    up: Literal[0] | Literal[1] = 0
    down: Literal[0] | Literal[1] = 0


def calculate_new_normal_velocity(first_mass, second_mass, first_velocity, second_velocity, elasticity):
    return ((first_mass - elasticity * second_mass) * first_velocity + (
            1 + elasticity) * second_mass * second_velocity) / (first_mass + second_mass)


class Simulation:

    def __init__(self, space_objects: list[SpaceObject], time_delta: float = 10 ** -5, simulation_time: float = 10,
                 G: float = 10, collision_type: CollisionType = CollisionType.ELASTIC,
                 acceleration_rate: float = 1, elasticity_coefficient: float = 0.5):
        self.space_objects: list[SpaceObject] = space_objects
        if time_delta <= 0:
            raise ValueError("Time delta must be positive")
        self.time_delta: float = time_delta
        if simulation_time <= 0:
            raise ValueError("Simulation time must be positive")
        self.simulation_time: float = simulation_time
        if G <= 0:
            raise ValueError("Gravity constant must be positive")
        self.G: float = G
        if collision_type not in [CollisionType.TRAVERSING, CollisionType.ELASTIC]:
            raise ValueError("Invalid collision_type")
        self.collision_type: CollisionType = collision_type
        if acceleration_rate <= 0:
            raise ValueError("Acceleration rate must be positive")
        self.acceleration_rate: float = acceleration_rate
        if 1 < elasticity_coefficient < 0:
            raise ValueError("Elasticity coefficient must be in [0, 1]")
        self.elasticity_coefficient: float = elasticity_coefficient
        if any(obj.movement_type == MovementType.CONTROLLABLE for obj in self.space_objects):
            self.controllable_acceleration: ControllableAcceleration = ControllableAcceleration()

    def calculate_collisions(self) -> None:
        collisions = []
        for i in range(len(self.space_objects)):
            for j in range(i + 1, len(self.space_objects)):
                if np.linalg.norm(self.space_objects[j].position - self.space_objects[i].position) <= \
                        self.space_objects[i].radius + self.space_objects[j].radius:
                    collisions.append((i, j))
        for i, j in collisions:
            normal_vector = (self.space_objects[j].position - self.space_objects[i].position) / np.linalg.norm(
                self.space_objects[j].position - self.space_objects[i].position)
            tangent_vector = np.array([-normal_vector[1], normal_vector[0]])

            normal_velocity_vector_i = np.dot(self.space_objects[i].velocity, normal_vector)
            tangent_velocity_vector_i = np.dot(self.space_objects[i].velocity, tangent_vector)
            normal_velocity_vector_j = np.dot(self.space_objects[j].velocity, normal_vector)
            tangent_velocity_vector_j = np.dot(self.space_objects[j].velocity, tangent_vector)
            if self.space_objects[i].movement_type != MovementType.STATIC:
                new_normal_velocity_vector_i = calculate_new_normal_velocity(
                    self.space_objects[i].mass,
                    self.space_objects[j].mass,
                    normal_velocity_vector_i,
                    normal_velocity_vector_j,
                    self.elasticity_coefficient,
                )
            else:
                new_normal_velocity_vector_i = normal_velocity_vector_i
            if self.space_objects[j].movement_type != MovementType.STATIC:
                new_normal_velocity_vector_j = calculate_new_normal_velocity(
                    self.space_objects[j].mass,
                    self.space_objects[i].mass,
                    normal_velocity_vector_j,
                    normal_velocity_vector_i,
                    self.elasticity_coefficient,
                )
            else:
                new_normal_velocity_vector_j = normal_velocity_vector_j
            self.space_objects[
                i].velocity = new_normal_velocity_vector_i * normal_vector + tangent_velocity_vector_i * tangent_vector
            self.space_objects[
                j].velocity = new_normal_velocity_vector_j * normal_vector + tangent_velocity_vector_j * tangent_vector

    def calculate_acceleration(self, i: int) -> np.array:
        if self.space_objects[i].movement_type == MovementType.STATIC:
            return np.zeros(2)
        acceleration = sum(
            self.G * self.space_objects[j].mass / np.linalg.norm(
                self.space_objects[j].position - self.space_objects[i].position) ** 1.5 * (
                    self.space_objects[j].position -
                    self.space_objects[i].position)
            for j in range(len(self.space_objects)) if j != i)
        if self.space_objects[i].movement_type == MovementType.CONTROLLABLE:
            acceleration += self.acceleration_rate * np.array(
                [self.controllable_acceleration.right - self.controllable_acceleration.left,
                 self.controllable_acceleration.up - self.controllable_acceleration.down])
        return acceleration

    def calculate_step(self) -> None:
        if self.collision_type == CollisionType.ELASTIC:
            self.calculate_collisions()
        for i in range(len(self.space_objects)):
            if self.space_objects[i].movement_type != MovementType.STATIC:
                self.space_objects[i].acceleration = self.calculate_acceleration(i)
                self.space_objects[i].position += self.space_objects[i].velocity * self.time_delta
                self.space_objects[i].velocity += self.space_objects[i].acceleration * self.time_delta
