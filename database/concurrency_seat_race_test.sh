#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/6] Logging in as demo user"
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@dhakabus.com","password":"user123"}' | jq -r '.data.token')

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "Login failed. Could not obtain token."
  exit 1
fi

echo "[2/6] Selecting one scheduled trip and adjacent stops"
TRIP_ID=$(docker-compose exec -T mysql mysql -N -uroot -ppassword -D dhaka_bus -e "SELECT id FROM trips WHERE status='scheduled' ORDER BY id LIMIT 1;" | tail -n 1 | tr -d '[:space:]')
ROUTE_ID=$(docker-compose exec -T mysql mysql -N -uroot -ppassword -D dhaka_bus -e "SELECT route_id FROM trips WHERE id=$TRIP_ID LIMIT 1;" | tail -n 1 | tr -d '[:space:]')
BOARD_STOP=$(docker-compose exec -T mysql mysql -N -uroot -ppassword -D dhaka_bus -e "SELECT id FROM bus_stops WHERE route_id=$ROUTE_ID ORDER BY stop_order ASC LIMIT 1;" | tail -n 1 | tr -d '[:space:]')
DROP_STOP=$(docker-compose exec -T mysql mysql -N -uroot -ppassword -D dhaka_bus -e "SELECT id FROM bus_stops WHERE route_id=$ROUTE_ID ORDER BY stop_order ASC LIMIT 1 OFFSET 1;" | tail -n 1 | tr -d '[:space:]')

echo "Trip: $TRIP_ID | Route: $ROUTE_ID | Boarding stop: $BOARD_STOP | Dropoff stop: $DROP_STOP"

echo "[3/6] Picking a seat number likely not booked yet"
SEAT=40
if docker-compose exec -T mysql mysql -N -uroot -ppassword -D dhaka_bus -e "SELECT COUNT(*) FROM tickets WHERE trip_id=$TRIP_ID AND status='active' AND JSON_CONTAINS(seat_numbers, '40');" | grep -q '^1$'; then
  SEAT=38
fi

echo "[4/6] Sending two concurrent booking requests for seat $SEAT"
PAYLOAD="{\"trip_id\":$TRIP_ID,\"boarding_stop_id\":$BOARD_STOP,\"dropoff_stop_id\":$DROP_STOP,\"seat_numbers\":[$SEAT],\"passenger_name\":\"Concurrency Test\"}"

OUT_A=$(mktemp)
OUT_B=$(mktemp)

curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" > "$OUT_A" &
PID_A=$!

curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" > "$OUT_B" &
PID_B=$!

wait $PID_A $PID_B

echo "[5/6] Results"
echo "--- Request A ---"
cat "$OUT_A"
echo "--- Request B ---"
cat "$OUT_B"

STATUS_A=$(grep 'HTTP_STATUS:' "$OUT_A" | awk -F: '{print $2}')
STATUS_B=$(grep 'HTTP_STATUS:' "$OUT_B" | awk -F: '{print $2}')
SUCCESS_COUNT=0
CONFLICT_COUNT=0

[[ "$STATUS_A" == "201" ]] && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
[[ "$STATUS_B" == "201" ]] && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
[[ "$STATUS_A" == "409" ]] && CONFLICT_COUNT=$((CONFLICT_COUNT + 1))
[[ "$STATUS_B" == "409" ]] && CONFLICT_COUNT=$((CONFLICT_COUNT + 1))

echo "[6/6] Verdict"
if [[ "$SUCCESS_COUNT" -eq 1 && "$CONFLICT_COUNT" -eq 1 ]]; then
  echo "PASS: Concurrency control is working (one success, one conflict)."
  exit 0
fi

echo "FAIL: Expected one 201 and one 409, got statuses A=$STATUS_A B=$STATUS_B"
exit 1
