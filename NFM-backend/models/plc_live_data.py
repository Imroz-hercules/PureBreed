from sqlalchemy import Column, Integer, Float, DateTime, String
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class PLCLiveData(Base):
    __tablename__ = 'plc_live_data'
    __table_args__ = {'schema': 'public'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # DB4 - Pellet Production Data (matching the image structure)
    pellet1_ton_hr = Column(Float, nullable=True)
    pellet2_ton_hr = Column(Float, nullable=True)
    pellet3_ton_hr = Column(Float, nullable=True)
    pellet1_kw_ton = Column(Float, nullable=True)
    pellet2_kw_ton = Column(Float, nullable=True)
    pellet3_kw_ton = Column(Float, nullable=True)
    pellet1_temp = Column(Float, nullable=True)
    pellet2_temp = Column(Float, nullable=True)
    pellet3_temp = Column(Float, nullable=True)

    def __repr__(self):
        return f"<PLCLiveData(id={self.id}, timestamp={self.timestamp}, pellet1_ton_hr={self.pellet1_ton_hr})>"

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S') if self.timestamp else None,
            'pellet1_ton_hr': self.pellet1_ton_hr,
            'pellet2_ton_hr': self.pellet2_ton_hr,
            'pellet3_ton_hr': self.pellet3_ton_hr,
            'pellet1_kw_ton': self.pellet1_kw_ton,
            'pellet2_kw_ton': self.pellet2_kw_ton,
            'pellet3_kw_ton': self.pellet3_kw_ton,
            'pellet1_temp': self.pellet1_temp,
            'pellet2_temp': self.pellet2_temp,
            'pellet3_temp': self.pellet3_temp,
        }
