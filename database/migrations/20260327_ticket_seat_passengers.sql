USE dhaka_bus;

CREATE TABLE IF NOT EXISTS ticket_seats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT NOT NULL,
  seat_number INT NOT NULL,
  passenger_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ticket_seat (ticket_id, seat_number),
  INDEX idx_ticket_seats_ticket (ticket_id),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Backfill per-seat records for existing tickets using seat_numbers JSON.
INSERT INTO ticket_seats (ticket_id, seat_number, passenger_name)
SELECT
  tk.id,
  jt.seat_number,
  COALESCE(NULLIF(TRIM(tk.passenger_name), ''), 'Passenger') AS passenger_name
FROM tickets tk
JOIN JSON_TABLE(
  tk.seat_numbers,
  '$[*]' COLUMNS (seat_number INT PATH '$')
) AS jt
LEFT JOIN ticket_seats ts
  ON ts.ticket_id = tk.id
 AND ts.seat_number = jt.seat_number
WHERE ts.id IS NULL;
