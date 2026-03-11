FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install prerequisites
RUN apt-get update && apt-get install -y \
    curl gnupg apt-transport-https ca-certificates gnupg2 software-properties-common && \
    mkdir -p /etc/apt/keyrings

# Add Microsoft GPG key and repository
RUN curl -sSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /etc/apt/keyrings/microsoft.gpg && \
    echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/microsoft.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list

# Install the ODBC driver
RUN apt-get update && ACCEPT_EULA=Y apt-get install -y \
    msodbcsql17 \
    unixodbc-dev \
    gcc \
    g++ \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install Python dependencies
RUN pip install --upgrade pip && pip install -r requirements.txt

EXPOSE 5000

CMD ["python", "app.py"]
