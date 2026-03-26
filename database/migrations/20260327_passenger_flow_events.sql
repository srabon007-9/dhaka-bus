USE dhaka_bus;

CREATE TABLE IF NOT EXISTS passenger_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT NOT NULL,
  trip_id INT NOT NULL,
  stop_id INT NOT NULL,
  seat_number INT NOT NULL,
  passenger_name VARCHAR(120) NOT NULL,
  event_type ENUM('board', 'alight') NOT NULL,
  event_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  recorded_by_user_id INT NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_passenger_events_trip_stop (trip_id, stop_id, event_time),
  INDEX idx_passenger_events_ticket_seat (ticket_id, seat_number, event_time),
  UNIQUE KEY uq_passenger_event_stop (ticket_id, seat_number, stop_id, event_type),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id) REFERENCES bus_stops(id) ON DELETE RESTRICT,
  FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);
