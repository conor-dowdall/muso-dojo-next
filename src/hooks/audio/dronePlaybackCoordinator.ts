interface DronePlaybackRegistration {
  stopAll: () => void;
}

export class DronePlaybackCoordinator {
  private activeIds = new Set<string>();
  private registrations = new Map<string, DronePlaybackRegistration>();

  register(id: string, registration: DronePlaybackRegistration) {
    this.registrations.set(id, registration);

    return () => {
      this.registrations.delete(id);

      this.activeIds.delete(id);
    };
  }

  activate(id: string) {
    this.activeIds.add(id);
  }

  clear(id: string) {
    this.activeIds.delete(id);
  }

  stopAll() {
    this.activeIds.forEach((id) => this.registrations.get(id)?.stopAll());
    this.activeIds.clear();
  }
}

export const dronePlaybackCoordinator = new DronePlaybackCoordinator();
