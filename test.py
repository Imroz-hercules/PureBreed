import snap7
from snap7.util import get_real

# PLC connection settings
PLC_IP = "192.168.2.3"
RACK = 0
SLOT = 3

# DB4 size and structure
DB4_SIZE = 36  # Pellet metrics (9 REAL values)

def read_real(data, offset):
    """Read a REAL (float) value from bytearray at a specific offset."""
    return get_real(data, offset)

def read_plc_data():
    client = snap7.client.Client()

    try:
        # Connect to PLC
        client.connect(PLC_IP, RACK, SLOT)
        if not client.get_connected():
            print("❌ Could not connect to PLC.")
            return

        print(f"✅ Connected to PLC at {PLC_IP}\n")

        # ---- Read DB4 (Pellet Data) ----
        try:
            db4_data = client.db_read(4, 0, DB4_SIZE)
            db4_values = {
                "Pellet1_TonHr": read_real(db4_data, 0),
                "Pellet2_TonHr": read_real(db4_data, 4),
                "Pellet3_TonHr": read_real(db4_data, 8),
                "Pellet1_KwTon": read_real(db4_data, 12),
                "Pellet2_KwTon": read_real(db4_data, 16),
                "Pellet3_KwTon": read_real(db4_data, 20),
                "Pellet1_Temp": read_real(db4_data, 24),
                "Pellet2_Temp": read_real(db4_data, 28),
                "Pellet3_Temp": read_real(db4_data, 32),
            }

            print("📦 DB4 - Pellet Data:")
            for key, val in db4_values.items():
                print(f"{key}: {val:.2f}")

        except Exception as e:
            print(f"⚠️ Error reading DB4: {e}")

    except Exception as e:
        print("❌ General PLC connection error:", e)

    finally:
        client.disconnect()
        print("\n🔌 Disconnected from PLC.")

# Run the script
if __name__ == "__main__":
    read_plc_data()
