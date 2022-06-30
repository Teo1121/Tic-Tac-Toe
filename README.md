# Tic-Tac-Toe

## Create Singleplayer Game

### Request

`GET /singleplayeGame`

    curl -i http://localhost:8080/singleplayerGame

### Response

    HTTP/1.1 200 OK
    Content-Type: application/json; charset=utf-8

    {
      "gameId": "6024b560-6b00-4e43-b06f-27215d59397e",
      "gameType": "S",
      "playerIds": [
        "69d78e22-fce8-40ff-9f55-906750c22e4b"
      ],
      "moveHistory": []
    }

## Create Multiplayer Game

### Request

`GET /multiplayerGame`

    curl -i http://localhost:8080/multiplayerGame

### Response

    HTTP/1.1 200 OK
    Content-Type: application/json; charset=utf-8

    {
      "gameId": "9a9cd9ac-9ecf-4ff7-8778-dbc1b230118b",
      "gameType": "M",
      "playerIds": [
        "6bb0a427-9693-4e94-be29-b256a94658be",
        "1ae2fd0c-92bf-44c7-9c18-79c3b7811c81"
      ],
      "moveHistory": []
    }

## Make a Move

### Request

`POST /gameId`

    curl -i -X POST -H 'Content-Type: application/json' -d {\"playerId\":\"6bb0a427-9693-4e94-be29-b256a94658be\",\"position\":\"0\"} http://localhost:8080/9a9cd9ac-9ecf-4ff7-8778-dbc1b230118b

### Response

    HTTP/1.1 200 OK
    Content-Type: application/json; charset=utf-8

    {"message":"Player 0 selected position 0"}

## Game Status

### Request

`GET /gameId`

    curl -i http://localhost:8080/9a9cd9ac-9ecf-4ff7-8778-dbc1b230118b

### Response

    HTTP/1.1 200 OK
    Content-Type: application/json; charset=utf-8

    {
      "gameId": "9a9cd9ac-9ecf-4ff7-8778-dbc1b230118b",
      "gameType": "M",
      "playerIds": [
        "6bb0a427-9693-4e94-be29-b256a94658be",
        "1ae2fd0c-92bf-44c7-9c18-79c3b7811c81"
      ],
      "moveHistory": []
    }
