# Komunikator - Specyfikacja Protokołu

## Przegląd
Aplikacja wykorzystuje architekturę klient-serwer opartą o WebSocket (Socket.io) do komunikacji w czasie rzeczywistym.

## Zdarzenia (Events)

### Uwierzytelnianie
*   **Klient -> Serwer**: `login`
    *   Payload: `{ username: string }`
    *   Opis: Rejestruje użytkownika w sesji.

### Pokoje (Rooms)
*   **Klient -> Serwer**: `join_room`
    *   Payload: `{ room: string, type: 'public' | 'private' }`
    *   Opis: Dołączenie do pokoju.
*   **Klient -> Serwer**: `leave_room`
    *   Payload: `{ room: string }`

### Wiadomości
*   **Klient -> Serwer**: `send_message`
    *   Payload:
        ```json
        {
          "content": "string",
          "author": "string",
          "room": "string",
          "type": "text" | "image" | "file",
          "timestamp": "ISO String"
        }
        ```
*   **Serwer -> Klient**: `receive_message`
    *   Payload: Obiekt wiadomości jak wyżej.

### Inne
*   **Serwer -> Klient**: `user_joined`
    *   Informacja o dołączeniu użytkownika.
*   **Serwer -> Klient**: `user_left`
    *   Informacja o opuszczeniu pokoju.
