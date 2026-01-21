# Komunikator - Specyfikacja Protokołu

## Przegląd
Aplikacja wykorzystuje architekturę klient-serwer opartą o WebSocket (Socket.io) do komunikacji w czasie rzeczywistym oraz REST API do uwierzytelniania. Wszystkie dane są przechowywane w bazie danych SQLite.

## Baza Danych
Aplikacja używa SQLite z następującymi tabelami:
- **users** - użytkownicy z zahashowanymi hasłami (bcrypt)
- **rooms** - pokoje czatu (publiczne i prywatne)
- **messages** - historia wszystkich wiadomości
- **room_members** - relacja użytkowników do pokoi

## REST API Endpoints

### Rejestracja
*   **POST** `/api/register`
    *   Body: `{ username: string, password: string }`
    *   Walidacja: username 3-20 znaków, hasło min. 6 znaków
    *   Response: `{ success: boolean, message?: string, error?: string }`

### Logowanie
*   **POST** `/api/login`
    *   Body: `{ username: string, password: string }`
    *   Response: `{ success: boolean, user?: { id, username, created_at }, error?: string }`

### Pokoje
*   **GET** `/api/rooms`
    *   Response: Lista wszystkich pokoi

## WebSocket Events

### Uwierzytelnianie
*   **Klient -> Serwer**: `authenticate`
    *   Payload: `{ userId: number, username: string }`
    *   Opis: Uwierzytelnia użytkownika w sesji WebSocket

### Pokoje (Rooms)
*   **Klient -> Serwer**: `join_room`
    *   Payload: `{ room: string }`
    *   Opis: Dołączenie do pokoju (wymaga uwierzytelnienia)
*   **Serwer -> Klient**: `room_history`
    *   Payload: Array wiadomości z historii pokoju
*   **Serwer -> Klient**: `user_joined`
    *   Payload: `{ username: string }`

### Wiadomości
*   **Klient -> Serwer**: `send_message`
    *   Payload:
        ```json
        {
          "room": "string",
          "content": "string",
          "type": "text" | "file",
          "file": "base64 string (optional)"
        }
        ```
    *   Uwaga: `username` i `timestamp` są dodawane przez serwer
*   **Serwer -> Klient**: `receive_message`
    *   Payload:
        ```json
        {
          "id": "number",
          "room": "string",
          "username": "string",
          "content": "string",
          "type": "text" | "file",
          "file_data": "base64 string | null",
          "timestamp": "ISO String"
        }
        ```

### Błędy
*   **Serwer -> Klient**: `error`
    *   Payload: `{ message: string }`

## Bezpieczeństwo
- Hasła są hashowane używając bcrypt (10 rund)
- Rate limiting na poziomie HTTP (100 req/15min) i WebSocket (1 msg/500ms)
- Helmet.js dla bezpieczeństwa nagłówków HTTP
- Walidacja wszystkich danych wejściowych
- Maksymalna długość wiadomości: 5000 znaków
