# from extensions import db
# from sqlalchemy import Index


# class KPI(db.Model):
#     __tablename__ = 'kpi'  # Explicit table name (good practice)
    
#     id = db.Column(db.Integer, primary_key=True)
#     batch_guid = db.Column(db.String(50), nullable=False, unique=True)
#     batch_name = db.Column(db.String(255), nullable=False)
#     product_name = db.Column(db.String(255), nullable=False)
#     batch_act_start = db.Column(db.DateTime, nullable=False)
    
#     # Define indexes here
#     __table_args__ = (
#         # Single column indexes
#         Index('idx_batch_guid', 'batch_guid'),  # Already unique but explicit index helps
#         Index('idx_product_name', 'product_name'),  # Good if you filter by product often
        
#         # Composite indexes (for multi-column queries)
#         Index('idx_product_batch_start', 'product_name', 'batch_act_start'),  # For product+date queries
#         Index('idx_batch_name_product', 'batch_name', 'product_name'),  # If you search batches by name+product
        
#         # Date index (critical for time-based queries)
#         Index('idx_batch_start_date', 'batch_act_start'),  # Essential for date range queries
#     )

#     def to_dict(self):
#         return {
#             "id": self.id,
#             "batch_guid": self.batch_guid,
#             "batch_name": self.batch_name,
#             "product_name": self.product_name,
#             "batch_act_start": self.batch_act_start
#         }

from extensions import db
from sqlalchemy import Index


class KPI(db.Model):
    __tablename__ = 'kpi'  # Explicit table name (good practice)
    
    id = db.Column(db.Integer, primary_key=True)
    batch_guid = db.Column(db.String(50), nullable=False, unique=True)
    batch_name = db.Column(db.String(255), nullable=False)
    product_name = db.Column(db.String(255), nullable=False)
    batch_act_start = db.Column(db.DateTime, nullable=False)
    
    # Define indexes here
    __table_args__ = (
        # Single column indexes
        Index('idx_batch_guid', 'batch_guid'),  # Already unique but explicit index helps
        Index('idx_product_name', 'product_name'),  # Good if you filter by product often
        
        # Composite indexes (for multi-column queries)
        Index('idx_product_batch_start', 'product_name', 'batch_act_start'),  # For product+date queries
        Index('idx_batch_name_product', 'batch_name', 'product_name'),  # If you search batches by name+product
        
        # Date index (critical for time-based queries)
        Index('idx_batch_start_date', 'batch_act_start'),  # Essential for date range queries
    )

    def to_dict(self):
        return {
            "id": self.id,
            "batch_guid": self.batch_guid,
            "batch_name": self.batch_name,
            "product_name": self.product_name,
            "batch_act_start": self.batch_act_start
        }