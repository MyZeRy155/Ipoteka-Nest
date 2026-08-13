echo "1. GET /calculations — список всех записей"
curl -i http://localhost:3000/calculations

echo "2. POST /calculate — создание новой записи"
curl -i -X POST http://localhost:3000/calculate -H "Content-Type: application/json" -d '{"mortgageAmount":
  100000, "interestRate": 15, "mortgageTermMonths": 24}'

echo "3. GET /calculations/1 — сидовая запись"
curl -i http://localhost:3000/calculations/1

echo "4. GET /calculations/9999 — несуществующий id"
curl -i http://localhost:3000/calculations/9999

echo "5. DELETE /calculations/2 — удаление созданной записи"
curl -i -X DELETE http://localhost:3000/calculations/2

echo "6. GET /calculations/2 — проверка, что запись удалена"
curl -i http://localhost:3000/calculations/2