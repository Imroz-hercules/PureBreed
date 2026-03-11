from extensions import db
from datetime import datetime

class DB4LiveData(db.Model):
    __bind_key__ = 'postgresql'                # 🔁 Use PostgreSQL only
    __tablename__ = 'db4_live_data'            # 🗃️ Table name in Postgres

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    pellet1_ton_hr = db.Column(db.Float, nullable=True)
    pellet2_ton_hr = db.Column(db.Float, nullable=True)
    pellet3_ton_hr = db.Column(db.Float, nullable=True)

    pellet1_kw_ton = db.Column(db.Float, nullable=True)
    pellet2_kw_ton = db.Column(db.Float, nullable=True)
    pellet3_kw_ton = db.Column(db.Float, nullable=True)

    pellet1_temp = db.Column(db.Float, nullable=True)
    pellet2_temp = db.Column(db.Float, nullable=True)
    pellet3_temp = db.Column(db.Float, nullable=True)

    def __repr__(self):
        return f"<DB4LiveData {self.id} @ {self.timestamp}>"
