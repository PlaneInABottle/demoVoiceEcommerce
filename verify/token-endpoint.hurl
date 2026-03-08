# Requires: HURL_VARIABLE_canonical_agent="$LIVEKIT_AGENT_NAME"
# Supplemental IPv6 loopback check when the local server listens on [::1]:
# curl -sSf -H 'Content-Type: application/json' -d '{}' http://[::1]:3000/api/token

POST http://localhost:3000/api/token
Content-Type: application/json

{}

HTTP 201
[Captures]
default_payload: jsonpath "$.participant_token" split "." nth 1 base64UrlSafeDecode utf8Decode
[Asserts]
jsonpath "$.server_url" exists
jsonpath "$.participant_token" exists
variable "default_payload" jsonpath "$.video.room" == "demoVoice-room"
variable "default_payload" jsonpath "$.roomConfig.agents" count == 1
variable "default_payload" jsonpath "$.roomConfig.agents[0].agentName" == "{{canonical_agent}}"
variable "default_payload" jsonpath "$.sub" matches /demo-[0-9a-f-]+/

POST http://localhost:3000/api/token
Content-Type: application/json

{
  "participant_attributes": {
    "role": "demo"
  }
}

HTTP 400

POST http://localhost:3000/api/token
Content-Type: application/json

{
  "participant_identity": "client-supplied-identity",
  "room_config": {
    "agents": [
      {
        "agent_name": "client-side-agent"
      }
    ]
  }
}

HTTP 201
[Captures]
override_payload: jsonpath "$.participant_token" split "." nth 1 base64UrlSafeDecode utf8Decode
[Asserts]
variable "override_payload" jsonpath "$.video.room" == "demoVoice-room"
variable "override_payload" jsonpath "$.sub" != "client-supplied-identity"
variable "override_payload" jsonpath "$.sub" matches /demo-[0-9a-f-]+/
variable "override_payload" jsonpath "$.roomConfig.agents[0].agentName" == "{{canonical_agent}}"
variable "override_payload" jsonpath "$.roomConfig.agents[0].agentName" != "client-side-agent"

POST http://localhost:3000/api/token
Content-Type: application/json

{
  "room_config": {
    "metadata": "unsupported"
  }
}

HTTP 400

POST http://localhost:3000/api/token
Content-Type: application/json
Origin: http://127.0.0.1:3000

{}

HTTP 403
