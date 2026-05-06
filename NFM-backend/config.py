# # from sqlalchemy import create_engine
# # from sqlalchemy.orm import sessionmaker

# # class Config:
# #     # Database connection URL
# #     SQLALCHEMY_DATABASE_URL = "mssql+pyodbc://HELLOKIDZZ\SQLEXPRESS/ASMREPORTING?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes"

# # # SQLAlchemy engine
# # engine = create_engine(Config.SQLALCHEMY_DATABASE_URL)

# # # Session local for queries
# # SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)





# import os
# from sqlalchemy.engine.url import URL
# from sqlalchemy import create_engine

# class Config:
#     SQLALCHEMY_DATABASE_URI = os.getenv(
#         "SQLALCHEMY_DATABASE_URI",
#         # "mssql+pyodbc://@DESKTOP-VNO43MQ\\SQLEXPRESS/ASMREPORTING?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes"
#         "mssql+pyodbc://AppUser:AppUser%40123@192.168.1.13:1433/ASMREPORTING?driver=ODBC+Driver+17+for+SQL+Server"
#         # "mssql+pyodbc://AppUser:AppUser%40123@host.docker.internal:1433/ASMREPORTING?driver=ODBC+Driver+17+for+SQL+Server"
#         # "mssql+pyodbc://HELLOKIDZZ\SQLEXPRESS/ASMREPORTING?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes"
#     )
#     SQLALCHEMY_TRACK_MODIFICATIONS = False

# if __name__ == "__main__":
#     engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
#     try:
#         with engine.connect() as connection:
#             result = connection.execute("SELECT * FROM dbo.BatchMaterials")
#             for row in result:
#                 print(row)
#     except Exception as e:
#         print(f"Error: {e}")
import os
from sqlalchemy import create_engine

class Config:
    # ✅ Primary database (SQL Server)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "SQLALCHEMY_DATABASE_URI",
#    r"mssql+pyodbc://DESKTOP-VNO43MQ\SQLEXPRESS/ASMREPORTING"
#     "?driver=ODBC+Driver+18+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes"
        "mssql+pyodbc://HERCULES/ASMBatchReports?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # # ✅ PostgreSQL bind for storing DB4 live data (COMMENTED OUT - no PostgreSQL)
    # SQLALCHEMY_BINDS = {
    #     'postgresql': os.getenv(
    #         "POSTGRESQL_DB_URI",
    #         # "postgresql+psycopg2://postgres:admin123@localhost:5432/nfm_reporting"
    #         "postgresql+psycopg2://postgres:Hercules@localhost:5432/nfm_reporting"
    #     )
    # }

# Optional DB test code
if __name__ == "__main__":
    print("🔄 Testing connections...\n")

    # Test SQL Server (default DB)
    try:
        sqlserver_engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
        with sqlserver_engine.connect() as conn:
            print("✅ Connected to SQL Server")
            result = conn.execute("SELECT TOP 1 * FROM dbo.BatchMaterials")
            for row in result:
                print("Sample SQL Server Row:", row)
    except Exception as e:
        print(f"❌ SQL Server connection error: {e}")

    print("\n--------------------------\n")

    # # Test PostgreSQL (bind DB) - COMMENTED OUT
    # try:
    #     postgres_engine = create_engine(Config.SQLALCHEMY_BINDS['postgresql'])
    #     with postgres_engine.connect() as conn:
    #         print("✅ Connected to PostgreSQL")
    #         result = conn.execute("SELECT version();")
    #         print("PostgreSQL Version:", result.fetchone()[0])
    # except Exception as e:
    #     print(f"❌ PostgreSQL connection error: {e}")
