import snap7
from snap7.util import get_real

# PLC connection details
PLC_IP = "192.168.2.18"
RACK = 0
SLOT = 3
DB3_SIZE = 8  # 2 REAL values

def read_real(data, offset):
    """Extract REAL (float) from bytearray at given offset."""
    return get_real(data, offset)

def read_db3():
    client = snap7.client.Client()
    try:
        client.connect(PLC_IP, RACK, SLOT)
        if not client.get_connected():
            print("❌ Could not connect to PLC.")
            return

        print(f"✅ Connected to PLC at {PLC_IP}")

        # Read DB3 (8 bytes from address 0)
        try:
            db3_data = client.db_read(3, 0, DB3_SIZE)
            hammer_amp = read_real(db3_data, 0)
            roller_amp = read_real(db3_data, 4)

            print("\n📦 DB3 - Mill Amps:")
            print(f"HammerMill_Amp: {hammer_amp:.2f}")
            print(f"RollerMill_Amp: {roller_amp:.2f}")

        except Exception as e:
            print(f"⚠️ Error reading DB3: {e}")

    except Exception as e:
        print(f"❌ Connection error: {e}")

    finally:
        client.disconnect()
        print("\n🔌 Disconnected from PLC.")

if __name__ == "__main__":
    read_db3()
