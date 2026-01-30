# Delivery Optimization API

Spring Boot 3.x WebFlux API for advanced Pick and Drop delivery optimization.

## Features
- **A* Routing**: Multi-criteria path optimization.
- **Kalman Filter**: Real-time ETA prediction with confidence intervals.
- **VRP Solver**: Tour optimization with capacity constraints.
- **WebSocket**: Live courier updates.
- **Reactive Stack**: Built with Project Reactor and R2DBC.

## Setup
1. Configure `application.yml` with your PostgreSQL credentials.
2. Run with Maven:
```bash
mvn spring-boot:run
```

## API Endpoints
- `POST /api/v1/routing/shortest-path`: Calculate optimal path.
- `POST /api/v1/tours/optimize`: Optimize delivery tour.
- `POST /api/v1/delivery/{id}/eta/update`: Update Kalman state.

## Architecture
Reference the `walkthrough.md` for mathematical formulations.
