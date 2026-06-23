interface DronePlaybackRegistration {
  stopAll: () => void;
}

export class DronePlaybackCoordinator {
  private activeId: string | undefined;
  private registrations = new Map<string, DronePlaybackRegistration>();

  register(id: string, registration: DronePlaybackRegistration) {
    this.registrations.set(id, registration);

    return () => {
      this.registrations.delete(id);

      if (this.activeId === id) {
        this.activeId = undefined;
      }
    };
  }

  activate(id: string) {
    const previousActiveId = this.activeId;

    if (previousActiveId && previousActiveId !== id) {
      this.registrations.get(previousActiveId)?.stopAll();
    }

    this.activeId = id;
  }

  clear(id: string) {
    if (this.activeId === id) {
      this.activeId = undefined;
    }
  }
}

export const dronePlaybackCoordinator = new DronePlaybackCoordinator();
