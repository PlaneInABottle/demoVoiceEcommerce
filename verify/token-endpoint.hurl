POST http://localhost:3000/api/token
Content-Type: application/json

{}

HTTP 201
[Asserts]
jsonpath "$.server_url" exists
jsonpath "$.participant_token" exists

POST http://localhost:3000/api/token
Content-Type: application/json

{
  "participant_metadata": "{\"role\":\"demo\"}"
}

HTTP 400

POST http://localhost:3000/api/token
Content-Type: application/json

{
  "room_config": {
    "metadata": "unsupported"
  }
}

HTTP 400
