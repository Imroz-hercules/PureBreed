# from extensions import db

# class KPIMaterial(db.Model):
#     __tablename__ = 'kpi_material'
#     # __tablename__ = 'BatchMaterials'
#     # __table_args__ = {'schema': 'dbo'}

#     Batch_GUID = db.Column('Batch GUID', db.String(100), primary_key=True)  # ✅ PRIMARY KEY
#     Batch_Name = db.Column('Batch Name', db.String(255))
#     Product_Name = db.Column('Product Name', db.String(255))
#     Batch_Act_Start = db.Column('Batch Act Start', db.DateTime)
#     Batch_Act_End = db.Column('Batch Act End', db.DateTime)
#     Quantity = db.Column('Quantity', db.Float)
#     Material_Name = db.Column('Material Name', db.String(255))
#     Material_Code = db.Column('Material Code', db.String(100))
#     SetPoint_Float = db.Column('SetPoint Float', db.Float)
#     Actual_Value_Float = db.Column('Actual Value Float', db.Float)
#     Source_Server = db.Column('Source Server', db.String(100))
#     ROOTGUID = db.Column('ROOTGUID', db.String(100))
#     OrderId = db.Column('OrderId', db.String(100))
#     EventID = db.Column('EventID', db.String(100))
#     Batch_Transfer_Time = db.Column('Batch Transfer Time', db.String(100))
#     FormulaCategoryName = db.Column('FormulaCategoryName', db.String(255))

#     def __repr__(self):
#         return f"<KPIMaterial {self.Batch_Name}>"

from extensions import db
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER

class KPIMaterial(db.Model):
    __tablename__ = 'BatchMaterials'
    __table_args__ = {'schema': 'dbo'}

    id = db.Column('ID', db.Integer, primary_key=True)
    source_server = db.Column('Source Server', db.String(255))
    batch_guid = db.Column('Batch GUID', UNIQUEIDENTIFIER)
    rootguid = db.Column('ROOTGUID', UNIQUEIDENTIFIER)
    order_id = db.Column('OrderId', db.Integer)
    batch_name = db.Column('Batch Name', db.String(255))
    product_name = db.Column('Product Name', db.String(255))
    batch_act_start = db.Column('Batch Act Start', db.DateTime)
    batch_act_end = db.Column('Batch Act End', db.DateTime)
    batch_transfer_time = db.Column('Batch Transfer Time', db.DateTime)
    quantity = db.Column('Quantity', db.Float)
    material_name = db.Column('Material Name', db.String(255))
    material_code = db.Column('Material Code', db.String(255))
    setpoint_float = db.Column('SetPoint Float', db.Float)
    actual_value_float = db.Column('Actual Value Float', db.Float)
    formula_category_name = db.Column('FormulaCategoryName', db.String(255))

    def __repr__(self):
        return f"<KPIMaterial {self.batch_name}>"