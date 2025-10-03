import socket
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Datos AMI - Configuration for Asterisk Manager Interface
HOST = 'localhost'  # Change to your Asterisk server IP
PORT = 5038
USERNAME = 'admin'  # Change to your AMI username
SECRET = 'amp111'   # Change to your AMI password

# Validar que se haya pasado un argumento
if len(sys.argv) < 2:
    print("Error: No se proporcionó el número de destino.")
    sys.exit(1)

# Configuración
EXT_ORIGEN = sys.argv[2]  # Se recibe desde PHP
NUMERO_DESTINO = sys.argv[1]  # Recibir número desde PHP
CALLERID = 'Anonimo'
TIMEOUT = 30000

# Canal debe llamar a la extensión primero (por ejemplo, Local/1020@from-internal)
CANAL = f'Local/{EXT_ORIGEN}@from-internal'

def realizar_llamada():
    try:
        s = socket.socket()
        s.connect((HOST, PORT))
        print("Conectado al servidor AMI")

        login = (
            f"Action: Login\r\n"
            f"Username: {USERNAME}\r\n"
            f"Secret: {SECRET}\r\n"
            f"Events: off\r\n\r\n"
        )
        s.sendall(login.encode())
        print(s.recv(1024).decode())

        # El número destino se marca después de que el origen conteste
        originate = (
            f"Action: Originate\r\n"
            f"Channel: {CANAL}\r\n"
            f"Exten: {NUMERO_DESTINO}\r\n"
            f"Context: from-internal\r\n"
            f"Priority: 1\r\n"
            f"Callerid: {CALLERID}\r\n"
            f"Timeout: {TIMEOUT}\r\n"
            f"Async: true\r\n\r\n"
        )

        print("Enviando comando ORIGINATE...")
        s.sendall(originate.encode())
        respuesta_llamada = s.recv(4096).decode()
        print("Respuesta a la llamada:")
        print(respuesta_llamada)

        s.close()
    except Exception as e:
        print("Error al realizar la llamada:")
        print(e)

if __name__ == "__main__":
    realizar_llamada()
