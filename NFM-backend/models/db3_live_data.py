from extensions import db
from datetime import datetime

class DB3LiveData(db.Model):
    __tablename__ = 'db3_live_data'
    __bind_key__ = 'postgresql'  # Use PostgreSQL database
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    hammermill_amp = db.Column(db.Float, nullable=False)
    rollermill_amp = db.Column(db.Float, nullable=False)
    
    def __repr__(self):
        return f'<DB3LiveData(id={self.id}, timestamp={self.timestamp}, hammermill_amp={self.hammermill_amp}, rollermill_amp={self.rollermill_amp})>'
